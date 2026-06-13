#!/usr/bin/env python3
"""
Harness self-audit — score THIS repo as a Claude Code harness.

Adapts the five-subsystem harness rubric from
walkinglabs/learn-harness-engineering (skills/harness-creator, MIT) to the
claudekit-engineer layout (rules/CLAUDE.md instead of AGENTS.md, plans/ as
state, eval/ + validators as verification, watzup/retro as lifecycle).

This is INSTRUMENTATION, not a behavior change: it produces a repeatable
harness-health score so each future kit improvement can be tracked. It does
not, by itself, move Tier 1 task-eval scores.

Scoring: 5 subsystems × 5 boolean checks. Subsystem score = #passed (0–5),
overall = round(total / 25 × 100). Bottleneck = lowest-scoring subsystem.

Usage:
  python3 eval/audit_harness.py            # text report
  python3 eval/audit_harness.py --json     # machine-readable
  python3 eval/audit_harness.py --min-score 80   # gate (exit 1 if below)
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]


# ── Check helpers ─────────────────────────────────────────────────────────────

def exists(rel: str) -> bool:
    return (REPO_ROOT / rel).exists()


def any_exists(*rels: str) -> bool:
    return any(exists(r) for r in rels)


def grep(pattern: str, *globs: str) -> bool:
    rx = re.compile(pattern, re.IGNORECASE)
    for g in globs:
        for path in REPO_ROOT.glob(g):
            if path.is_file():
                try:
                    if rx.search(path.read_text(encoding="utf-8", errors="ignore")):
                        return True
                except OSError:
                    continue
    return False


def json_path(rel: str, *keys: str):
    try:
        data = json.loads((REPO_ROOT / rel).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    for k in keys:
        if not isinstance(data, dict) or k not in data:
            return None
        data = data[k]
    return data


def pkg_script(name: str) -> bool:
    val = json_path("package.json", "scripts", name)
    return isinstance(val, str) and val.strip() != ""


# ── Rubric (adapted to claudekit-engineer) ───────────────────────────────────
# Each check: (label, predicate). 5 per subsystem.

CHECKS: dict[str, list[tuple[str, callable]]] = {
    "instructions": [
        ("rules/CLAUDE.md instruction entrypoint",
         lambda: exists("claude/rules/CLAUDE.md")),
        ("startup / primary workflow documented",
         lambda: any_exists("claude/rules/primary-workflow.md",
                            "claude/rules/orchestration-protocol.md")),
        ("definition-of-done / completion gate",
         lambda: exists("claude/hooks/workflow-artifact-gate.cjs")
                 or grep(r"definition of done|done only when|completion gate",
                         "claude/rules/*.md")),
        ("verification discoverable from config",
         lambda: pkg_script("test") or exists("eval/run.py")),
        ("instructions route to state artifacts",
         lambda: json_path("claude/.ck.json", "paths", "plans") is not None
                 or grep(r"\bplans/|plan\.md|feature_list", "claude/rules/*.md")),
    ],
    "state": [
        ("plans/ workspace + templates",
         lambda: exists("plans/templates")),
        ("plan state config (.ck.json plan.*)",
         lambda: json_path("claude/.ck.json", "plan", "namingFormat") is not None),
        ("session-state persistence hook",
         lambda: exists("claude/hooks/session-state.cjs")),
        ("machine-readable feature/status tracker",
         lambda: any_exists("feature_list.json", "feature-list.json",
                            "claude/templates/feature-list.json")),  # known gap
        ("progress / handoff mechanism",
         lambda: exists("claude/skills/watzup/SKILL.md")
                 or any_exists("progress.md", "claude-progress.md")),
    ],
    "verification": [
        ("execution eval harness present",
         lambda: exists("eval/run.py")),
        ("test command documented",
         lambda: pkg_script("test")),
        ("static validators present",
         lambda: exists("claude/scripts/validate-skill-frontmatter.py")),
        ("single verify entrypoint (init.sh / npm run verify)",
         lambda: exists("init.sh") or pkg_script("verify")),  # known gap
        ("verification tests / evidence",
         lambda: exists("claude/hooks/__tests__")),
    ],
    "scope": [
        ("scout-first gate",
         lambda: exists("claude/hooks/scout-block.cjs")),
        ("workflow artifact gate",
         lambda: exists("claude/hooks/workflow-artifact-gate.cjs")),
        ("simplify / over-build gate",
         lambda: exists("claude/hooks/simplify-gate.cjs")),
        ("scope boundary documented",
         lambda: grep(r"\bscope\b|one feature|stay in scope", "claude/rules/*.md")),
        ("feature dependency tracking",
         lambda: any_exists("feature_list.json", "feature-list.json")
                 and grep(r"dependenc", "feature_list.json", "feature-list.json")),  # known gap
    ],
    "lifecycle": [
        ("session init hook",
         lambda: exists("claude/hooks/session-init.cjs")),
        ("session handoff skill (watzup)",
         lambda: exists("claude/skills/watzup/SKILL.md")),
        ("retrospective skill",
         lambda: exists("claude/skills/retro/SKILL.md")),
        ("session-state lifecycle hook",
         lambda: exists("claude/hooks/session-state.cjs")),
        ("clean-restart / session-handoff template",
         lambda: any_exists("session-handoff.md",
                            "claude/templates/session-handoff.md")),  # known gap
    ],
}


# ── Scoring ───────────────────────────────────────────────────────────────────

def audit() -> dict:
    subsystems = {}
    gaps = []
    for name, checks in CHECKS.items():
        passed = []
        for label, fn in checks:
            ok = bool(fn())
            passed.append(ok)
            if not ok:
                gaps.append({"subsystem": name, "check": label})
        subsystems[name] = {"score": sum(passed), "max": len(checks),
                            "passed": passed}
    total = sum(s["score"] for s in subsystems.values())
    overall = round(total / (5 * 5) * 100)
    bottleneck = min(subsystems.items(), key=lambda kv: kv[1]["score"])[0]
    return {"overall": overall, "bottleneck": bottleneck,
            "subsystems": subsystems, "gaps": gaps}


def print_report(result: dict) -> None:
    print("=== Harness Self-Audit ===  (5 subsystems × 5 checks)\n")
    for name, sub in result["subsystems"].items():
        score, mx = sub["score"], sub["max"]
        bar = "█" * score + "·" * (mx - score)
        print(f"  {name:<13} {score}/{mx}  {bar}")
    print(f"\nOverall: {result['overall']}/100   "
          f"Bottleneck: {result['bottleneck']} "
          f"({result['subsystems'][result['bottleneck']]['score']}/5)")
    if result["gaps"]:
        print("\nGaps (failed checks):")
        for g in result["gaps"]:
            print(f"  [{g['subsystem']}] {g['check']}")


def main() -> int:
    ap = argparse.ArgumentParser(description="Score this repo as a Claude Code harness")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--min-score", type=int, default=None,
                    help="exit 1 if overall < this (default: advisory, exit 0)")
    args = ap.parse_args()

    result = audit()
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print_report(result)

    if args.min_score is not None and result["overall"] < args.min_score:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
