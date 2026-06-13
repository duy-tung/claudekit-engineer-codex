# AGENTS.md

Short entrypoint for coding agents. Read this first; it links to the rest.

## Startup Workflow (before writing code)

1. `pwd` — confirm the working directory.
2. Read this file fully.
3. Run `./init.sh` to verify the environment is healthy.
4. Read `feature_list.json` and recent commits to see the current state.

## Working Rules

- **One feature at a time** — pick exactly one unfinished feature from `feature_list.json`.
- **Verification required** — never claim completion without running the checks.
- **Update artifacts** — update `progress.md` and `feature_list.json` before ending.
- **Stay in scope** — do not modify unrelated files.
- **Leave a clean state** — the repo must restart from `./init.sh`.

## Definition of Done

A feature is done only when ALL hold:

- the target behavior is implemented,
- verification commands have actually been run,
- evidence (command + result) is recorded in `feature_list.json`,
- the repo remains restartable from standard paths.

## Required Artifacts

- `feature_list.json` — authoritative feature/status tracker (schema: `feature-list.schema.json`).
- `progress.md` — session continuity log.
- `init.sh` — verification entrypoint.
- `session-handoff.md` — handoff for multi-session work.

## End of Session

- Update `progress.md` and feature statuses.
- Document unresolved risks and the recommended next step.
- Commit with descriptive messages; leave the repo clean for the next startup.
