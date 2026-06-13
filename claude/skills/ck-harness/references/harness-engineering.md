# Harness Engineering — reference

**Harness engineering** is the discipline of designing the environment around a coding agent so it produces reliable results — *not* prompt tuning. Coined/popularized by OpenAI ("Harness engineering: leveraging Codex in an agent-first world", an experiment shipping ~1M LOC with zero human-written lines) with parallel guidance from Anthropic on harnesses for long-running agents.

A harness has five integrated subsystems. `scripts/harness.py audit` scores each with 5 boolean checks (25 total → /100; subsystem score = passed checks; bottleneck = lowest).

## Rubric (25 checks)

### Instructions (`AGENTS.md` / `CLAUDE.md`)
1. An agent instruction file exists.
2. A startup workflow ("before writing code") is documented.
3. A "Definition of Done" is documented.
4. Verification is discoverable (mentions `./init.sh` / test / verify).
5. Instructions route to state artifacts (`feature_list.json` / `progress.md`).

### State (`feature_list.json`, `progress.md`)
1. A feature tracker exists.
2. It is valid and each feature has `id` / `name` / `description` / `status`.
3. `progress.md` exists.
4. Progress supports restart ("Current State" / "What" / "Next").
5. Handoff captures blockers / files / next step.

### Verification (`init.sh`)
1. An `init.sh` entrypoint exists.
2. It fails fast (`set -e`).
3. A test command is documented.
4. A static/build check is documented.
5. Verification evidence is recorded (command + result).

### Scope
1. One-feature-at-a-time is documented.
2. Feature dependencies are tracked.
3. Feature status is explicit.
4. A scope boundary is documented ("stay in scope").
5. A completion gate is documented (Definition of Done).

### Lifecycle
1. A startup script exists.
2. An end-of-session procedure is documented.
3. `session-handoff.md` exists.
4. Session restart markers exist (Last Updated / Current Objective / Next Step).
5. A clean restart path is documented.

## Principle: audit → route → reframe

Discoverability and reliability are part of the contract. When a subsystem scores low, fix *that* subsystem (the bottleneck) — confirmed against real agent failures, not guesses. Start minimal; add advanced structure (memory, tool safety, multi-agent coordination) only when a concrete failure justifies it.

## Sources

- OpenAI — *Harness engineering: leveraging Codex in an agent-first world* — https://openai.com/index/harness-engineering/
- walkinglabs — *learn-harness-engineering* (MIT) — https://github.com/walkinglabs/learn-harness-engineering
- walkinglabs — *awesome-harness-engineering* — https://github.com/walkinglabs/awesome-harness-engineering
- Repo study: `docs/research/harness-engineering-walkinglabs.md`
