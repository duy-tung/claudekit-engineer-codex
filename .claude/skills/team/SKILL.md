---
name: team
description: "[CK] Orchestrate Agent Teams for parallel multi-session collaboration. Use for research, implementation, and review workflows requiring independent teammates."
version: 1.0.0
---

# Agent Teams - Multi-Session Orchestration

Coordinate multiple independent Claude Code sessions as a team. Each teammate has its own context window, loads project context (CLAUDE.md, skills, agents), and communicates via shared task list and messaging.

**Requires:** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in settings.json env.

**Principles:** YAGNI, KISS, DRY | Token efficiency | File ownership boundaries

## Usage

```
/team <template> <context>
```

**Templates:**
- `/team research <topic>` — 3 researchers investigating different angles
- `/team implement <plan-path-or-description>` — Planner + developers + tester
- `/team review <scope>` — Security + performance + test coverage reviewers

**Flags:**
- `--plan-approval` — Require teammates to plan before implementing (default for `implement`)
- `--no-plan-approval` — Skip plan approval (default for `research` and `review`)
- `--delegate` — Lead only coordinates, never touches code (press Shift+Tab after team creation)

## When to Use Agent Teams vs Subagents

| Scenario | Subagents (Task tool) | Agent Teams |
|----------|----------------------|-------------|
| Focused task (test, lint, single review) | **Yes** | Overkill |
| Sequential chain (plan → code → test) | **Yes** | No |
| 3+ independent parallel workstreams | Maybe | **Yes** |
| Competing debug hypotheses | No | **Yes** |
| Cross-layer work (FE + BE + tests) | Maybe | **Yes** |
| User wants to steer individual workers | No | **Yes** |
| Token budget is tight | **Yes** | No (high token cost) |
| Workers need to discuss/challenge findings | No | **Yes** |

**Default:** Subagents remain the default for focused tasks. Use Agent Teams when parallel exploration + inter-agent discussion adds real value.

---

## Team Templates

### Research Team

**Activation:** `/team research <topic>`

**Composition:**
| Role | Agent Type | Model | Purpose |
|------|-----------|-------|---------|
| Researcher A | researcher | haiku | Investigate approach/architecture angle |
| Researcher B | researcher | haiku | Investigate alternatives/competitors |
| Researcher C | researcher | haiku | Investigate risks/edge cases |
| Lead (you) | — | — | Synthesize findings into report |

**Plan approval:** No
**File ownership:** Researchers are read-only (research only, no code changes)

**Lead instructions:**
1. Create team: `Teammate(operation: "spawnTeam", team_name: "<topic-slug>")`
2. Create 3 tasks via `TaskCreate` — one per research angle
3. Spawn 3 researcher teammates via `Task(subagent_type: "researcher", team_name: "<topic-slug>")`
4. Each researcher claims a task, investigates, reports findings
5. Wait for all researchers to complete
6. Synthesize findings into a single report
7. Shut down teammates and clean up team

**Spawn prompt template for researchers:**
```
Research <specific-angle> for the topic: <topic>.
Focus on: <angle-specific-focus>.
Report findings concisely. Challenge assumptions.
When done, mark your task as completed and send findings to the lead.
```

---

### Implementation Team

**Activation:** `/team implement <plan-path-or-description>`

**Composition:**
| Role | Agent Type | Model | Plan Approval |
|------|-----------|-------|---------------|
| Planner | planner | sonnet | No (plans are the output) |
| Developer A | fullstack-developer | sonnet | **Yes** |
| Developer B | fullstack-developer | sonnet | **Yes** |
| Tester | tester | haiku | No |
| Lead (you) | — | — | Review plans, orchestrate, merge |

**Plan approval:** **Required** — each developer must plan before coding. Lead reviews and approves/rejects.
**File ownership:** **CRITICAL** — each developer owns distinct files. No two teammates edit the same file.

**Lead instructions:**
1. Read the plan (if plan-path provided) or create one via planner teammate
2. Create team: `Teammate(operation: "spawnTeam", team_name: "<feature-slug>")`
3. Break plan into tasks with file ownership boundaries:
   - Task A: "Implement backend API — owns: src/api/*, src/models/*"
   - Task B: "Implement frontend UI — owns: src/components/*, src/pages/*"
   - Task C: "Write tests — blocked by A and B — owns: tests/*"
4. Set task dependencies: tester blocked by developers
5. Spawn teammates with `mode: "plan"` for developers
6. Review each developer's plan when submitted → approve or reject with feedback
7. After developers complete, unblock tester
8. Synthesize results, verify integration
9. Shut down teammates and clean up team

**File ownership rules:**
- Define explicit file boundaries in each task description
- If two tasks need the same file, restructure tasks or have lead handle the shared file
- Tester owns test files only; reads (but never edits) implementation files

**Spawn prompt template for developers:**
```
Implement <task-description>.
File ownership: You own <file-list>. Do NOT edit files outside your ownership.
Plan your approach first — your plan requires lead approval before implementation.
After completing, mark task as completed and notify the lead.
```

---

### Review Team

**Activation:** `/team review <scope>`

**Composition:**
| Role | Agent Type | Model | Focus |
|------|-----------|-------|-------|
| Security Reviewer | code-reviewer | haiku | Vulnerabilities, auth, injection, OWASP |
| Performance Reviewer | code-reviewer | haiku | Bottlenecks, memory, complexity, caching |
| Test Coverage Reviewer | tester | haiku | Coverage gaps, edge cases, flaky tests |
| Lead (you) | — | — | Synthesize, prioritize, create action items |

**Plan approval:** No
**File ownership:** All reviewers are read-only (review only, no code changes)

**Lead instructions:**
1. Create team: `Teammate(operation: "spawnTeam", team_name: "review-<scope-slug>")`
2. Create 3 tasks — one per review focus
3. Spawn reviewers with specific focus in their prompts
4. Each reviewer reports findings independently
5. Lead synthesizes: deduplicate, prioritize by severity, create action items
6. Shut down teammates and clean up team

**Spawn prompt template for reviewers:**
```
Review <scope> focusing exclusively on <focus-area>.
Examine: <specific-files-or-directories>.
Rate each finding: critical / high / medium / low.
Report findings concisely. Do NOT make code changes.
When done, mark your task as completed and send findings to the lead.
```

---

## Coordination Patterns

### Task Dependencies

```
TaskCreate(subject: "Implement API endpoints")     → task #1
TaskCreate(subject: "Implement UI components")      → task #2
TaskCreate(subject: "Write integration tests")      → task #3
TaskUpdate(taskId: "3", addBlockedBy: ["1", "2"])   → #3 blocked until #1 and #2 done
```

### Teammate Lifecycle

```
1. Teammate(operation: "spawnTeam")    → create team
2. Task(team_name: ..., name: ...)     → spawn teammates
3. TaskCreate / TaskUpdate             → assign work
4. SendMessage(type: "message")        → direct communication
5. SendMessage(type: "shutdown_request") → graceful shutdown
6. Teammate(operation: "cleanup")      → remove team resources
```

### Token Budget Guidance

| Template | Estimated Tokens | Model Strategy |
|----------|-----------------|----------------|
| Research (3 teammates) | ~150K-300K | haiku for all researchers |
| Implement (4 teammates) | ~400K-800K | sonnet for devs, haiku for tester |
| Review (3 teammates) | ~100K-200K | haiku for all reviewers |

**Warning:** Agent Teams use significantly more tokens than subagents. Use only when parallel exploration + discussion adds clear value.

---

## Error Recovery

When a teammate crashes, goes unresponsive, or produces wrong output:

1. **Check status**: Use `Shift+Up/Down` (in-process) or click pane (split) to inspect
2. **Redirect**: Send a direct message with corrective instructions
3. **Replace**: If unrecoverable, shut down the failed teammate and spawn a replacement:
   ```
   Ask <teammate-name> to shut down.
   Spawn a new <role> teammate to continue task #N.
   ```
4. **Reassign**: Update the stuck task via `TaskUpdate` to unblock dependent work

## Abort / Cancel Team

To terminate a team mid-flight:
```
Shut down all teammates. Then clean up the team.
```

The lead will send shutdown requests to each teammate, wait for confirmations, then run `Teammate(operation: "cleanup")`.

**If teammates are unresponsive**, close the terminal or kill the session. Orphaned team configs at `~/.claude/teams/` can be cleaned up manually.

## Model Fallback

Templates recommend specific models (haiku for researchers/reviewers, sonnet for developers). If a model is unavailable on your plan:
- Claude will automatically fall back to the default model
- You can override: "Use haiku for all teammates" or "Use sonnet for everyone"
- Token cost scales with model capability — haiku is most cost-effective for read-only tasks

## When to Use `/team` vs `/cook --parallel`

| | `/team <template>` | `/cook --parallel` |
|---|---|---|
| **Architecture** | Independent sessions (Agent Teams) | Subagents within one session |
| **Communication** | Teammates message each other | Subagents report to lead only |
| **Token cost** | Higher (N context windows) | Lower (shared context) |
| **User steering** | Can message teammates directly | Cannot interact with subagents |
| **Best for** | Research, cross-layer work, debates | Sequential implementation with parallel phases |

**Rule of thumb:** Use `/cook --parallel` for straightforward implementation. Use `/team implement` when you need teammates to discuss, challenge, or coordinate across boundaries.

---

## Display Modes

- **in-process** (default): All teammates in one terminal. `Shift+Up/Down` to navigate. `Ctrl+T` for task list.
- **split panes**: Requires tmux or iTerm2. Each teammate gets own pane.

Set in settings.json:
```json
{ "teammateMode": "in-process" }
```

## Limitations (Experimental)

- No session resumption for in-process teammates
- Task status can lag — check manually if stuck
- One team per session
- No nested teams (teammates can't spawn teams)
- Lead is fixed for team lifetime
- Permissions set at spawn (inherited from lead)
