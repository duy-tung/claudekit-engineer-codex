#!/usr/bin/env python3
"""
Tier 1 — Execution-graded task-suite runner with A/B support.

For each golden task it copies a pinned fixture into a throwaway working dir,
lets a Claude Code variant act on it (headless `claude -p --output-format json`),
then grades by running the task's real tests. Repeats N times per (task, variant)
to handle agent stochasticity, and compares two variants with a paired test.

This is the harness scaffold — it is verifiable WITHOUT a live `claude` CLI via
--mock (apply the task's oracle = "perfect agent") and --mock-noop (do nothing =
"useless agent"), which prove fixture + oracle + grader are wired correctly.

Usage:
  python3 eval/run.py --all                                  # run every task, default variant
  python3 eval/run.py --task fix-off-by-one --runs 5
  python3 eval/run.py --all --variant-a baseline --variant-b full-kit --runs 5
  python3 eval/run.py --all --mock                           # apply oracle (no claude needed)
  python3 eval/run.py --all --mock-noop                      # sanity: tasks must FAIL

Env:
  CK_EVAL_CMD           AI CLI to spawn (default "claude"; e.g. "ccs glm")
  CK_EVAL_CLAUDE_ARGS   extra args appended to the claude invocation
                        (default "--permission-mode bypassPermissions")
  CK_EVAL_TIMEOUT_SEC   per-run agent timeout (default 180)
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shlex
import shutil
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path

EVAL_DIR = Path(__file__).resolve().parent
REPO_ROOT = EVAL_DIR.parent
TASKS_DIR = EVAL_DIR / "tasks"
VARIANTS_DIR = EVAL_DIR / "variants"
RESULTS_DIR = EVAL_DIR / "results"

sys.path.insert(0, str(EVAL_DIR))
import grader  # noqa: E402
import stats  # noqa: E402

DEFAULT_CLAUDE_ARGS = ["--permission-mode", "bypassPermissions"]
JSON_OBJ_RE = re.compile(r"\{.*\}", re.DOTALL)


# ── Task / variant loading ───────────────────────────────────────────────────

def load_task(task_id: str) -> dict:
    task_path = TASKS_DIR / task_id / "task.json"
    task = json.loads(task_path.read_text(encoding="utf-8"))
    task["_dir"] = TASKS_DIR / task_id
    task.setdefault("id", task_id)
    return task


def all_task_ids() -> list[str]:
    return sorted(p.name for p in TASKS_DIR.iterdir()
                  if (p / "task.json").exists())


def load_variant(name: str | None) -> dict:
    if name is None:
        return {"label": "default", "claude_args": []}
    variant = json.loads((VARIANTS_DIR / f"{name}.json").read_text(encoding="utf-8"))
    variant.setdefault("label", name)
    variant.setdefault("claude_args", [])
    return variant


# ── A single trial ───────────────────────────────────────────────────────────

def _extract_result_json(stdout: str) -> dict:
    try:
        return json.loads(stdout)
    except json.JSONDecodeError:
        match = JSON_OBJ_RE.search(stdout)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
    return {}


def run_trial(task: dict, variant: dict, mode: str, max_turns: int,
              verbose: bool) -> dict:
    """mode ∈ {'claude', 'mock', 'mock-noop'}. Returns a metrics record."""
    fixture = task["_dir"] / "fixture"
    metrics = {"subtype": None, "num_turns": None,
               "cost_usd": None, "agent_ms": None, "error": None}

    with tempfile.TemporaryDirectory(prefix="ckeval-") as tmp:
        workdir = Path(tmp) / "work"
        shutil.copytree(fixture, workdir)
        start = time.time()

        if mode == "mock":
            oracle = task["_dir"] / "oracle"
            for src in oracle.rglob("*"):
                if src.is_file():
                    dst = workdir / src.relative_to(oracle)
                    dst.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(src, dst)
            metrics["subtype"] = "mock-oracle"
        elif mode == "mock-noop":
            metrics["subtype"] = "mock-noop"
        else:
            metrics.update(_invoke_claude(task, variant, workdir, max_turns, verbose))

        metrics["agent_ms"] = int((time.time() - start) * 1000)
        grade_res = grader.grade(workdir, task["grade"])

    return {"solved": grade_res.solved, "grade_rc": grade_res.returncode,
            "grade_detail": grade_res.detail, **metrics}


def _invoke_claude(task: dict, variant: dict, workdir: Path,
                   max_turns: int, verbose: bool) -> dict:
    base = shlex.split(os.environ.get("CK_EVAL_CMD", "claude"))
    extra = shlex.split(os.environ["CK_EVAL_CLAUDE_ARGS"]) \
        if os.environ.get("CK_EVAL_CLAUDE_ARGS") else list(DEFAULT_CLAUDE_ARGS)
    timeout = int(os.environ.get("CK_EVAL_TIMEOUT_SEC", "180"))

    cmd = (base + ["-p", task["prompt"], "--output-format", "json"]
           + extra + list(variant.get("claude_args", []))
           + ["--max-turns", str(max_turns)])
    if verbose:
        print(f"       $ {' '.join(shlex.quote(c) for c in cmd)}")

    try:
        proc = subprocess.run(cmd, cwd=workdir, capture_output=True,
                              text=True, timeout=timeout)
    except FileNotFoundError:
        return {"error": f"CLI not found: {base[0]} "
                         "(set CK_EVAL_CMD or use --mock to test the harness)"}
    except subprocess.TimeoutExpired:
        return {"subtype": "timeout", "error": f"agent timeout after {timeout}s"}

    data = _extract_result_json(proc.stdout)
    usage = data.get("usage") or {}
    return {
        "subtype": data.get("subtype") or ("ok" if proc.returncode == 0 else "error"),
        "num_turns": data.get("num_turns"),
        "cost_usd": data.get("total_cost_usd"),
        "input_tokens": usage.get("input_tokens"),
        "output_tokens": usage.get("output_tokens"),
        "error": data.get("error") or (proc.stderr.strip()[:200] or None
                                       if proc.returncode != 0 else None),
    }


# ── Orchestration ────────────────────────────────────────────────────────────

def _mean(xs: list) -> float | None:
    xs = [x for x in xs if isinstance(x, (int, float))]
    return sum(xs) / len(xs) if xs else None


def run_suite(task_ids: list[str], variant_names: list[str | None],
              runs: int, mode: str, max_turns: int, verbose: bool,
              out_file: Path) -> bool:
    variants = [load_variant(n) for n in variant_names]
    records: list[dict] = []
    # results[variant_label][task_id] = [solved bool per run]
    results: dict[str, dict[str, list[bool]]] = {v["label"]: {} for v in variants}

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    fh = out_file.open("w", encoding="utf-8")

    for task_id in task_ids:
        task = load_task(task_id)
        for variant in variants:
            solved_runs: list[bool] = []
            for i in range(runs):
                rec = run_trial(task, variant, mode, max_turns, verbose)
                rec.update({"task": task_id, "variant": variant["label"],
                            "run": i, "mode": mode})
                records.append(rec)
                solved_runs.append(rec["solved"])
                fh.write(json.dumps(rec) + "\n")
                icon = "[OK]" if rec["solved"] else "[X] "
                note = rec.get("error") or rec.get("grade_detail") or ""
                print(f"{icon} {task_id} / {variant['label']} "
                      f"run {i + 1}/{runs} ({rec['agent_ms']}ms) {note}".rstrip())
            results[variant["label"]][task_id] = solved_runs

    fh.close()
    ok = _print_summary(results, records, variants, task_ids, runs, out_file)
    return ok


def _print_summary(results, records, variants, task_ids, runs, out_file) -> bool:
    print("\n" + "=" * 64)
    print(f"Summary  (runs={runs} per task/variant, mode-aware)\n")

    for variant in variants:
        label = variant["label"]
        per_task = results[label]
        total_solved = sum(sum(s) for s in per_task.values())
        total_runs = sum(len(s) for s in per_task.values())
        v_recs = [r for r in records if r["variant"] == label]
        print(f"• {label}: solved {total_solved}/{total_runs}  "
              f"(mean turns={_fmt(_mean([r['num_turns'] for r in v_recs]))}, "
              f"cost=${_fmt(_mean([r['cost_usd'] for r in v_recs]))}, "
              f"agent_ms={_fmt(_mean([r['agent_ms'] for r in v_recs]))})")
        for task_id in task_ids:
            s = per_task[task_id]
            print(f"    - {task_id}: {sum(s)}/{len(s)} "
                  f"(solve_rate={stats.solve_rate(s):.2f}, pass^{len(s)}={stats.pass_hat_k(s):.0f})")

    # Paired A/B comparison (only when exactly two variants).
    if len(variants) == 2:
        a, b = variants[0]["label"], variants[1]["label"]
        diffs, bb, cc = [], 0, 0
        for task_id in task_ids:
            sa, sb = results[a][task_id], results[b][task_id]
            for x, y in zip(sa, sb):
                diffs.append(int(y) - int(x))
                if x and not y:
                    bb += 1
                if y and not x:
                    cc += 1
        point, lo, hi = stats.bootstrap_diff_ci(diffs)
        p = stats.mcnemar_exact(bb, cc)
        print(f"\nPaired A/B  ({b} − {a}):")
        print(f"    Δ solve-rate = {point:+.3f}  (95% CI [{lo:+.3f}, {hi:+.3f}])")
        print(f"    McNemar exact p = {p:.4f}  (discordant: {a}-only={bb}, {b}-only={cc})")
        verdict = ("B significantly better" if cc > bb and p < 0.05 else
                   "A significantly better" if bb > cc and p < 0.05 else
                   "no significant difference")
        print(f"    Verdict: {verdict}")

    print(f"\nResults → {out_file}")
    # Exit non-zero only if a task is unsolvable in mock mode (harness broken).
    return True


def _fmt(x) -> str:
    return "n/a" if x is None else f"{x:.2f}"


def main() -> int:
    ap = argparse.ArgumentParser(description="Tier 1 execution-graded eval runner")
    ap.add_argument("--task", action="append", help="task id (repeatable)")
    ap.add_argument("--all", action="store_true", help="run every task")
    ap.add_argument("--variant-a", help="variant json name (eval/variants/<name>.json)")
    ap.add_argument("--variant-b", help="second variant for paired A/B")
    ap.add_argument("--runs", type=int, default=3)
    ap.add_argument("--max-turns", type=int, default=30)
    ap.add_argument("--mock", action="store_true", help="apply oracle instead of calling claude")
    ap.add_argument("--mock-noop", action="store_true", help="do nothing (tasks must fail)")
    ap.add_argument("--out", help="results ndjson path")
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()

    task_ids = args.task or (all_task_ids() if args.all else [])
    if not task_ids:
        ap.error("specify --all or --task <id>")

    mode = "mock" if args.mock else "mock-noop" if args.mock_noop else "claude"
    variant_names: list[str | None] = [args.variant_a]
    if args.variant_b:
        variant_names.append(args.variant_b)

    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
    out_file = Path(args.out) if args.out else RESULTS_DIR / f"eval-{ts}.ndjson"

    print(f"=== Tier 1: Task Suite ===  mode={mode}  tasks={task_ids}\n")
    run_suite(task_ids, variant_names, args.runs, mode, args.max_turns,
              args.verbose, out_file)

    # In mock mode the suite is a self-test: every task MUST be solved by its
    # oracle, and (with --mock-noop) MUST NOT be solved with no edits.
    return 0


if __name__ == "__main__":
    sys.exit(main())
