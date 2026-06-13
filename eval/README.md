# Eval harness (maintainer-only)

A local-first, dependency-free (Python stdlib) harness for measuring whether a
change to the **Claude Code setup** (skills / hooks / agents / rules) actually
makes Claude Code *do real tasks better* — before merging the change.

> Not shipped to end users. Lives at repo root (outside `claude/`) so it never
> installs into a user's `.claude/`. Rationale + the research behind this design:
> [`docs/research/eval-claude-code-setup.md`](../docs/research/eval-claude-code-setup.md).

## The two tiers

| Tier | Cost | What it does | Command |
|---|---|---|---|
| **Tier 0 — Static** | ~$0, <5s | Runs the surviving validators (`validate-skill-frontmatter.py`, `validate-skill-crossrefs.py`) | `npm run eval:static` |
| **Tier 1 — Task suite** | depends on model | Runs golden SWE tasks through `claude -p`, grades by **running real tests**, repeats N× for variance, A/B compares two setups | `npm run eval` |

## How Tier 1 works

For each golden task in `tasks/<id>/`:

1. Copy `fixture/` (a pinned repo state with a failing test) into a throwaway dir.
2. Run a **variant** of Claude Code headless: `claude -p "<prompt>" --output-format json …`.
3. **Grade by execution:** run the task's `test_cmd`; exit 0 ⇒ *solved*. The test
   file is authored so it passes only when the bug is fixed / feature implemented
   **and** nothing regresses (SWE-bench's `FAIL_TO_PASS` + `PASS_TO_PASS`, folded
   into one signal).
4. Repeat `--runs N` times (agents are stochastic). Metrics captured per run:
   `solved`, `num_turns`, `total_cost_usd`, `duration_ms`, `subtype`.

Two variants ⇒ a **paired A/B**: per-task McNemar exact p-value + bootstrap CI on
the solve-rate difference, with a plain-language verdict.

## Verify the harness without a live CLI

The scaffold is self-testing — no `claude` auth needed:

```bash
npm run eval:mock        # apply each task's oracle ("perfect agent") → ALL must solve
python3 eval/run.py --all --mock-noop   # do nothing ("useless agent") → ALL must fail
```

If mock solves everything and mock-noop solves nothing, the fixtures + graders
are wired correctly.

## Real A/B run (in a Claude Code environment)

```bash
# Does the kit help vs a bare Claude Code?
python3 eval/run.py --all --variant-a baseline --variant-b full-kit --runs 5
```

- Variants live in `variants/*.json` (`label` + `claude_args` passed through to `claude`).
- `no-harness-rule` (A) = default Claude, no rule. `with-harness-rule` (B) = default Claude **+ only** the harness-discipline rule via `--append-system-prompt-file`. Both run in the same environment, differing by one variable.
- **Gotcha:** do NOT put `--bare` in a variant. In headless mode `--bare` skips auth discovery and every run returns `"Not logged in"` → a false `0/N` (floor effect), not a real result.
- **Headroom matters:** to measure a behavioral rule, the task's base solve-rate must be strictly between 0 and 1. If plain Claude already solves a task every time (ceiling) or never (floor), the A/B shows `Δ=0` for the wrong reason. Pick/author tasks where the baseline genuinely fails some of the time.
- Env: `CK_EVAL_CMD` (default `claude`, e.g. `"ccs glm"`),
  `CK_EVAL_CLAUDE_ARGS` (default `--permission-mode bypassPermissions`),
  `CK_EVAL_TIMEOUT_SEC` (default 180).

Results stream to `results/eval-<ts>.ndjson` (git-ignored).

## Adding a task

```
tasks/<id>/
  task.json     { id, prompt, grade:{ test_cmd, fail_to_pass[], pass_to_pass[], timeout_sec } }
  fixture/      starting repo state — MUST contain a test that fails before the change
  oracle/       reference solution (files copied over fixture in --mock) — proves solvability
```

Keep tasks small, deterministic, and stdlib-only (the samples use `python3 -m unittest`).
For larger/representative suites, see SWE-smith / terminal-bench patterns in the research doc.

## Files

- `run.py` — Tier 1 orchestrator + A/B stats
- `grader.py` — execution grader (run tests → pass/fail)
- `stats.py` — pass^k, McNemar exact, bootstrap CI (stdlib only)
- `tier0_static.py` — Tier 0 wrapper around the surviving validators
- `variants/`, `tasks/`, `results/`
