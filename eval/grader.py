#!/usr/bin/env python3
"""
Execution-based grader for Tier 1 tasks.

A task is "solved" iff its test command exits 0 in the working directory after
the agent (or the oracle, in --mock mode) has made its edits. This folds the
SWE-bench FAIL_TO_PASS + PASS_TO_PASS invariants into a single signal: the test
file is authored so it passes only when the bug is fixed / feature implemented
AND no pre-existing behavior regresses.
"""
from __future__ import annotations

import subprocess
from dataclasses import dataclass
from pathlib import Path


@dataclass
class GradeResult:
    solved: bool
    returncode: int
    detail: str


def grade(workdir: Path, grade_cfg: dict) -> GradeResult:
    """Run optional setup commands then the test command; exit 0 == solved."""
    timeout = int(grade_cfg.get("timeout_sec", 120))

    for setup_cmd in grade_cfg.get("setup", []):
        try:
            subprocess.run(setup_cmd, cwd=workdir, capture_output=True,
                           text=True, timeout=timeout)
        except (subprocess.TimeoutExpired, OSError) as exc:
            return GradeResult(False, -1, f"setup failed: {exc}")

    test_cmd = grade_cfg["test_cmd"]
    try:
        proc = subprocess.run(test_cmd, cwd=workdir, capture_output=True,
                              text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        return GradeResult(False, -1, f"test timeout after {timeout}s")
    except OSError as exc:
        return GradeResult(False, -1, f"test spawn error: {exc}")

    detail = (proc.stderr or proc.stdout or "").strip().splitlines()
    tail = " | ".join(detail[-3:]) if detail else ""
    return GradeResult(proc.returncode == 0, proc.returncode, tail)
