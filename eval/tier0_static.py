#!/usr/bin/env python3
"""
Tier 0 — Static validation gate (~$0, <5s).

Thin wrapper that runs the surviving static validators in claude/scripts/
and aggregates their exit codes. No LLM, no network. Run this on every commit
before the more expensive Tier 1 task suite.

Usage:
  python3 eval/tier0_static.py
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]

# (label, argv). Each must exit non-zero on failure to act as a gate.
CHECKS: list[tuple[str, list[str]]] = [
    ("skill-frontmatter", ["python3", "claude/scripts/validate-skill-frontmatter.py"]),
    ("skill-crossrefs", ["python3", "claude/scripts/validate-skill-crossrefs.py", "claude/skills/"]),
]


def main() -> int:
    print("=== Tier 0: Static Validation ===\n")
    failures = 0
    for label, argv in CHECKS:
        proc = subprocess.run(argv, cwd=REPO_ROOT, capture_output=True, text=True)
        ok = proc.returncode == 0
        icon = "[OK]" if ok else "[X] "
        print(f"{icon} {label} (exit {proc.returncode})")
        if not ok:
            failures += 1
            # Surface the tail of stderr/stdout so the failure is actionable.
            tail = (proc.stderr or proc.stdout or "").strip().splitlines()[-15:]
            for line in tail:
                print(f"       {line}")
    print(f"\nSummary: {len(CHECKS) - failures} pass, {failures} fail")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
