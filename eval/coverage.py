#!/usr/bin/env python3
"""Eval coverage — report task-suite breadth and flag thin coverage.

Adapts the eval-coverage idea from learn-harness-engineering's run-benchmark
to our execution-graded suite: scores task COUNT, KIND diversity, and per-task
WELL-FORMEDNESS (prompt + fixture/ + oracle/ + grade.test_cmd). Advisory by
default; --min-score gates.

Usage:
  python3 eval/coverage.py            # text report
  python3 eval/coverage.py --json
  python3 eval/coverage.py --min-score 70
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

EVAL_DIR = Path(__file__).resolve().parent
TASKS_DIR = EVAL_DIR / "tasks"

DESIRED_KINDS = ["bugfix", "feature", "multi-step", "regression", "refactor"]
TARGET_TASKS = 6


def load_tasks() -> list[dict]:
    tasks = []
    if not TASKS_DIR.is_dir():
        return tasks
    for d in sorted(p for p in TASKS_DIR.iterdir() if p.is_dir()):
        tj = d / "task.json"
        if not tj.is_file():
            continue
        try:
            data = json.loads(tj.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            data = {}
        wellformed = (bool(data.get("prompt"))
                      and (d / "fixture").is_dir()
                      and (d / "oracle").is_dir()
                      and bool((data.get("grade") or {}).get("test_cmd")))
        tasks.append({"id": d.name, "kind": data.get("kind", "unknown"),
                      "wellformed": wellformed})
    return tasks


def assess(tasks: list[dict]) -> dict:
    n = len(tasks)
    kinds = {}
    for t in tasks:
        kinds[t["kind"]] = kinds.get(t["kind"], 0) + 1
    present = [k for k in DESIRED_KINDS if k in kinds]
    missing = [k for k in DESIRED_KINDS if k not in kinds]
    wellformed = sum(1 for t in tasks if t["wellformed"])

    count_ratio = min(1.0, n / TARGET_TASKS) if TARGET_TASKS else 1.0
    kind_ratio = len(present) / len(DESIRED_KINDS)
    wf_ratio = (wellformed / n) if n else 0.0
    overall = round((count_ratio + kind_ratio + wf_ratio) / 3 * 100)

    return {"tasks": n, "target": TARGET_TASKS, "by_kind": kinds,
            "missing_kinds": missing, "wellformed": wellformed,
            "ratios": {"count": round(count_ratio * 100),
                       "kinds": round(kind_ratio * 100),
                       "wellformed": round(wf_ratio * 100)},
            "overall": overall}


def main() -> int:
    ap = argparse.ArgumentParser(description="Report eval task-suite coverage")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--min-score", type=int, default=None)
    args = ap.parse_args()

    res = assess(load_tasks())
    if args.json:
        print(json.dumps(res, indent=2))
    else:
        print("=== Eval Coverage ===\n")
        print(f"  Tasks: {res['tasks']}  (target {res['target']})")
        print(f"  By kind: " + ", ".join(f"{k}={v}" for k, v in sorted(res["by_kind"].items())))
        if res["missing_kinds"]:
            print(f"  Missing kinds: {', '.join(res['missing_kinds'])}")
        print(f"  Well-formed: {res['wellformed']}/{res['tasks']}")
        r = res["ratios"]
        print(f"\n  Coverage: {res['overall']}/100  "
              f"(count {r['count']}%, kinds {r['kinds']}%, well-formed {r['wellformed']}%)")
        if res["overall"] < 80:
            tips = []
            if res["ratios"]["count"] < 100:
                tips.append(f"add tasks to reach >= {res['target']}")
            if res["missing_kinds"]:
                tips.append(f"cover kinds: {', '.join(res['missing_kinds'])}")
            if res["wellformed"] < res["tasks"]:
                tips.append("fix malformed tasks (need prompt + fixture/ + oracle/ + grade.test_cmd)")
            print("  Recommendation: " + "; ".join(tips) + ".")

    if args.min_score is not None and res["overall"] < args.min_score:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
