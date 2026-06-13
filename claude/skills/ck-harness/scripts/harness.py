#!/usr/bin/env python3
"""ck:harness — scaffold and audit a Claude Code harness for any repo.

Five subsystems: instructions, state, verification, scope, lifecycle.
Adapts the scoring rubric from walkinglabs/learn-harness-engineering (MIT).
Stdlib only.

Usage:
  python3 harness.py audit  --target DIR [--json] [--min-score N]
  python3 harness.py create --target DIR [--agent-file AGENTS.md|CLAUDE.md] [--force]
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parents[1]
TEMPLATES = SKILL_DIR / "templates"


# ── target inspection helpers ────────────────────────────────────────────────

class Target:
    def __init__(self, root: Path):
        self.root = root

    def exists(self, *names: str) -> bool:
        return any((self.root / n).exists() for n in names)

    def text(self, *names: str) -> str:
        out = []
        for n in names:
            p = self.root / n
            if p.is_file():
                try:
                    out.append(p.read_text(encoding="utf-8", errors="ignore"))
                except OSError:
                    pass
        return "\n".join(out)

    def has(self, pattern: str, *names: str) -> bool:
        return re.search(pattern, self.text(*names), re.IGNORECASE) is not None

    def feature_json(self):
        for n in ("feature_list.json", "feature-list.json"):
            p = self.root / n
            if p.is_file():
                try:
                    return json.loads(p.read_text(encoding="utf-8"))
                except (OSError, json.JSONDecodeError):
                    return {}
        return None


def _features_valid(data) -> bool:
    if not isinstance(data, dict) or not isinstance(data.get("features"), list):
        return False
    req = {"id", "name", "description", "status"}
    return all(isinstance(f, dict) and req <= set(f) for f in data["features"])


def _features_have(data, key: str) -> bool:
    return (isinstance(data, dict)
            and any(isinstance(f, dict) and key in f for f in data.get("features", [])))


# ── rubric (generic, mirrors learn-harness-engineering) ──────────────────────

def rubric(t: Target) -> dict:
    fj = t.feature_json()
    AG = ("AGENTS.md", "CLAUDE.md")
    checks = {
        "instructions": [
            ("AGENTS.md/CLAUDE.md entrypoint", t.exists(*AG)),
            ("startup workflow documented", t.has(r"startup|before writing code|first move", *AG)),
            ("definition of done documented", t.has(r"definition of done|done only when|done when", *AG)),
            ("verification discoverable", t.has(r"\./init\.sh|\btest\b|\bverify\b", *AG)),
            ("routes to state artifacts", t.has(r"feature_list\.json|feature-list\.json|progress\.md", *AG)),
        ],
        "state": [
            ("feature tracker exists", t.exists("feature_list.json", "feature-list.json")),
            ("feature tracker valid (id/name/description/status)", _features_valid(fj)),
            ("progress.md exists", t.exists("progress.md")),
            ("progress supports restart", t.has(r"current state|what was done|\bnext\b", "progress.md")),
            ("handoff captures blockers/next", t.exists("session-handoff.md")
                or t.has(r"blocker|next step|files changed", "progress.md", "session-handoff.md")),
        ],
        "verification": [
            ("init.sh entrypoint", t.exists("init.sh")),
            ("init.sh fails fast (set -e)", t.has(r"set -e", "init.sh")),
            ("test command documented", t.has(r"\btest\b|pytest|vitest|cargo test|go test|npm test|dotnet test", "init.sh", *AG)),
            ("static/build check documented", t.has(r"build|type|lint|compile", "init.sh", *AG)),
            ("verification evidence recorded", _features_have(fj, "evidence")
                or t.has(r"evidence", "progress.md", "feature_list.json", "feature-list.json")),
        ],
        "scope": [
            ("one-feature-at-a-time rule", t.has(r"one feature|one-feature|a single feature", *AG)),
            ("feature dependencies tracked", _features_have(fj, "dependencies")),
            ("explicit status field", _features_have(fj, "status")),
            ("scope boundary documented", t.has(r"stay in scope|in scope|scope boundary", *AG)),
            ("completion gate documented", t.has(r"definition of done|done only when", *AG)),
        ],
        "lifecycle": [
            ("startup script exists", t.exists("init.sh")),
            ("end-of-session procedure", t.has(r"end of session|before ending|end-of-session", *AG)),
            ("session-handoff.md exists", t.exists("session-handoff.md")),
            ("session restart markers", t.has(r"last updated|current objective|recommended next step",
                                              "session-handoff.md", "progress.md")),
            ("clean restart path documented", t.has(r"restartable|clean state|next steps|restart",
                                                    "session-handoff.md", *AG)),
        ],
    }
    subsystems, gaps = {}, []
    for name, items in checks.items():
        passed = [ok for _, ok in items]
        subsystems[name] = {"score": sum(passed), "max": len(items)}
        gaps += [{"subsystem": name, "check": label} for label, ok in items if not ok]
    total = sum(s["score"] for s in subsystems.values())
    overall = round(total / 25 * 100)
    bottleneck = min(subsystems.items(), key=lambda kv: kv[1]["score"])[0]
    return {"overall": overall, "bottleneck": bottleneck,
            "subsystems": subsystems, "gaps": gaps}


# ── commands ──────────────────────────────────────────────────────────────────

def cmd_audit(args) -> int:
    t = Target(Path(args.target).resolve())
    if not t.root.is_dir():
        print(f"[X] target not a directory: {t.root}")
        return 2
    res = rubric(t)
    if args.json:
        print(json.dumps(res, indent=2))
    else:
        print(f"=== Harness Audit ===  {t.root}\n")
        for name, sub in res["subsystems"].items():
            bar = "█" * sub["score"] + "·" * (sub["max"] - sub["score"])
            print(f"  {name:<13} {sub['score']}/{sub['max']}  {bar}")
        print(f"\nOverall: {res['overall']}/100   Bottleneck: {res['bottleneck']} "
              f"({res['subsystems'][res['bottleneck']]['score']}/5)")
        if res["gaps"]:
            print("\nGaps (failed checks):")
            for g in res["gaps"]:
                print(f"  [{g['subsystem']}] {g['check']}")
    if args.min_score is not None and res["overall"] < args.min_score:
        return 1
    return 0


# dest filename -> template filename
SCAFFOLD = {
    "feature_list.json": "feature-list.json",
    "feature-list.schema.json": "feature-list.schema.json",
    "init.sh": "init.sh",
    "progress.md": "progress.md",
    "session-handoff.md": "session-handoff.md",
}


def cmd_create(args) -> int:
    root = Path(args.target).resolve()
    root.mkdir(parents=True, exist_ok=True)
    plan = dict(SCAFFOLD)
    plan[args.agent_file] = "AGENTS.md"  # AGENTS.md or CLAUDE.md per flag

    created, skipped = [], []
    for dest, tmpl in plan.items():
        src = TEMPLATES / tmpl
        dst = root / dest
        if dst.exists() and not args.force:
            skipped.append(dest)
            continue
        shutil.copyfile(src, dst)
        if dest == "init.sh":
            dst.chmod(0o755)
        created.append(dest)

    for d in created:
        print(f"[+] {d}")
    for s in skipped:
        print(f"[=] {s} (exists, use --force to overwrite)")
    print(f"\nScaffolded {len(created)} file(s); {len(skipped)} kept. "
          f"Next: fill feature_list.json, wire init.sh to real checks, then `audit`.")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="Scaffold/audit a Claude Code harness")
    sub = ap.add_subparsers(dest="command", required=True)

    a = sub.add_parser("audit", help="score a repo across the five harness subsystems")
    a.add_argument("--target", default=".")
    a.add_argument("--json", action="store_true")
    a.add_argument("--min-score", type=int, default=None)
    a.set_defaults(func=cmd_audit)

    c = sub.add_parser("create", help="scaffold missing harness primitives")
    c.add_argument("--target", default=".")
    c.add_argument("--agent-file", default="AGENTS.md",
                   choices=["AGENTS.md", "CLAUDE.md"])
    c.add_argument("--force", action="store_true")
    c.set_defaults(func=cmd_create)

    args = ap.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
