---
name: ck:harness
description: "Build, audit, and improve a Claude Code harness for any repo — AGENTS.md/CLAUDE.md instructions, machine-readable feature-list state, a fail-fast verification entrypoint, scope boundaries, and session handoff. Scores a project across five harness subsystems and scaffolds the missing primitives."
when_to_use: "Invoke to make a repo more reliable for coding agents: scaffold harness files for a new or existing project, or audit an existing repo's agent-readiness and close the weakest subsystem. Not for model/prompt tuning, UI, or application architecture."
user-invocable: true
category: dev-tools
keywords: [harness, agent-readiness, AGENTS.md, feature-list, verification, scaffold, audit]
license: MIT
argument-hint: "[audit|create] [--target DIR] [--json]"
metadata:
  author: claudekit
  version: "1.0.0"
  attribution: "Adapts the five-subsystem harness model and scoring rubric from walkinglabs/learn-harness-engineering (MIT); concept from OpenAI 'Harness engineering' and Anthropic harness guidance."
---

# Harness Skill

You build and audit **harnesses**: the structure around a coding agent that makes its work reliable. A harness is NOT prompt tuning or application architecture — it is the environment the agent operates inside.

## The five subsystems

| Subsystem | Question it answers | Primitive |
|---|---|---|
| **Instructions** | How does the agent start, and when is it done? | `AGENTS.md` / `CLAUDE.md` |
| **State** | What's the current status and evidence? | `feature_list.json`, `progress.md` |
| **Verification** | How is completion proven? | `init.sh` (tests/build/lint) |
| **Scope** | What keeps the agent from overreaching? | feature dependencies, one-at-a-time |
| **Lifecycle** | How does the next session resume cleanly? | `session-handoff.md` |

## Routing

- "set up / scaffold a harness for this project" → **create**
- "is this repo agent-ready? / score it / what's the weak spot?" → **audit**

## Audit

```bash
python3 scripts/harness.py audit --target <repo-dir>
```

Report the per-subsystem scores, overall /100, and the **bottleneck** (lowest subsystem). Treat the bottleneck as a *candidate* weakness — confirm it against real agent failure logs or task outcomes before a big change. Then propose the smallest fix that raises it, and list the specific failed checks.

## Create

```bash
python3 scripts/harness.py create --target <repo-dir> [--agent-file CLAUDE.md] [--force]
```

Scaffolds any missing primitives from `templates/`: `AGENTS.md` (or `CLAUDE.md`), `feature-list.json` (+ schema), `init.sh`, `progress.md`, `session-handoff.md`. It never overwrites existing files without `--force`. After scaffolding:

1. Fill `feature_list.json` with the real features (`id`/`name`/`description`/`status`/`dependencies`).
2. Replace `init.sh`'s placeholder with the project's real build/test/lint commands.
3. Re-run `audit` to confirm the score rose.

## Principles (audit → route → reframe)

- Start **minimal**; add advanced structure only when a real failure justifies it.
- Grade **outcomes** (did verification pass?), not the agent's path.
- A claim of "done" without a recorded verification run is **not** done.
- The lowest subsystem is the bottleneck — fix that first, not whatever is easiest.

## Constraints

- Read-then-write: inspect existing instruction/state/verification files before scaffolding.
- Never overwrite without `--force`. Keep generated files small and skimmable (progressive disclosure).

## Reference

`references/harness-engineering.md` — the full 25-check rubric and sources.
