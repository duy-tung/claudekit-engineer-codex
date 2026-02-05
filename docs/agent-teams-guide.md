# Agent Teams — Orchestration Guide

> Feature added in ClaudeKit Engineer v2.11.x | Claude Code v2.1.32+ | Status: Experimental

## Overview

Agent Teams enable multiple **independent Claude Code sessions** working in parallel, coordinated by a lead session. Unlike subagents (Task tool), teammates have their own context windows, communicate peer-to-peer, and share a task list.

**Use case:** Complex tasks where parallel exploration + inter-agent discussion adds value (research, cross-layer implementation, competing hypotheses).

## Prerequisites

Enable in `settings.json`:
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

## Architecture

```
Lead Session (you)
  ├── Teammate A (own context, own session)
  ├── Teammate B (own context, own session)
  └── Teammate C (own context, own session)
      │
      └── Shared: Task List + Mailbox
```

| Component | Location | Purpose |
|-----------|----------|---------|
| Team config | `~/.claude/teams/{name}/config.json` | Team membership |
| Task list | `~/.claude/tasks/{name}/` | Shared work items |
| Lead | Main Claude Code session | Coordinates, assigns, synthesizes |
| Teammates | Separate sessions | Independent workers |

**Context inheritance:** Each teammate loads CLAUDE.md, skills, agents, hooks, MCP servers — same as any fresh session. They do NOT inherit the lead's conversation history.

## Team Templates

Activate via `/team` skill:

### Research Team
```
/team research "best caching strategies for our API"
```
- 3 researcher teammates investigating different angles
- No plan approval — researchers are read-only
- Lead synthesizes findings into single report
- Model: haiku (cost-effective for research)

### Implementation Team
```
/team implement plans/260205-feature/plan.md
```
- Planner + 2-3 developers + tester
- **Plan approval required** — each dev plans before coding
- File ownership boundaries enforced (prevents overwrites)
- Task dependencies: planner → devs → tester
- Model: sonnet for devs, haiku for tester

### Review Team
```
/team review src/auth/
```
- Security + Performance + Test Coverage reviewers
- Each reviews independently with specific focus
- Lead synthesizes, deduplicates, prioritizes
- Model: haiku for all reviewers

## Teams vs Subagents — When to Use Which

| Scenario | Subagents | Agent Teams |
|----------|-----------|-------------|
| Quick focused task (test, lint) | **Use this** | Overkill |
| Sequential chain (plan → code → test) | **Use this** | No |
| 3+ parallel workstreams | Maybe | **Use this** |
| Competing debug hypotheses | No | **Use this** |
| Cross-layer (FE + BE + tests) | Maybe | **Use this** |
| User steers individual workers | No | **Use this** |
| Token budget tight | **Use this** | No |

**Default rule:** Subagents for focused tasks. Teams for collaborative parallel work.

## Teams vs `/cook --parallel`

| | `/team implement` | `/cook --parallel` |
|---|---|---|
| Architecture | Independent sessions | Subagents in one session |
| Communication | Peer-to-peer messaging | Report to lead only |
| Token cost | Higher (N context windows) | Lower |
| User control | Can message teammates directly | Cannot interact with subagents |
| Best for | Research, debates, cross-layer | Sequential implementation |

## Key Tools (Used by Lead)

| Tool | Purpose |
|------|---------|
| `Teammate(operation: "spawnTeam")` | Create team |
| `Task(team_name, name, subagent_type)` | Spawn teammate |
| `TaskCreate / TaskUpdate / TaskList` | Manage shared tasks |
| `SendMessage(type: "message")` | DM a teammate |
| `SendMessage(type: "broadcast")` | Message all (use sparingly) |
| `SendMessage(type: "shutdown_request")` | Graceful shutdown |
| `Teammate(operation: "cleanup")` | Remove team resources |

## File Ownership (Critical for Implementation Teams)

Each teammate **MUST** own distinct files. Two teammates editing the same file = silent overwrites.

```
Task A: "Implement API" — owns: src/api/*, src/models/*
Task B: "Implement UI" — owns: src/components/*, src/pages/*
Task C: "Write tests" — owns: tests/* (blocked by A and B)
```

If two tasks need the same file → restructure tasks or have lead handle the shared file.

## Task Dependencies

```
TaskCreate(subject: "Implement API")        → #1
TaskCreate(subject: "Implement UI")         → #2
TaskCreate(subject: "Write tests")          → #3
TaskUpdate(taskId: "3", addBlockedBy: ["1", "2"])
```

Task #3 auto-unblocks when #1 and #2 complete.

## Error Recovery

| Situation | Action |
|-----------|--------|
| Teammate unresponsive | Check via Shift+Up/Down, send direct message |
| Teammate producing wrong output | Redirect with corrective message |
| Teammate crashed | Shut down, spawn replacement, reassign task |
| Need to abort entire team | "Shut down all teammates. Clean up the team." |

## Display Modes

| Mode | Terminal | Setup |
|------|----------|-------|
| in-process (default) | All in one terminal | None |
| split panes | Each teammate gets own pane | tmux or iTerm2 |

Navigate in-process: `Shift+Up/Down` (select teammate), `Ctrl+T` (task list).

Configure in settings.json:
```json
{ "teammateMode": "in-process" }
```

## Hook Integration

The `session-init.cjs` hook detects active teams and injects:
- `CK_AGENT_TEAM` — active team name
- `CK_AGENT_TEAM_MEMBERS` — member count

This ensures teammates receive ClaudeKit context (naming patterns, plan paths, reports directory) via the standard SessionStart hook flow.

## Token Budget

| Template | Est. Tokens | Strategy |
|----------|-------------|----------|
| Research (3 teammates) | 150K-300K | haiku for all |
| Implement (4 teammates) | 400K-800K | sonnet devs, haiku tester |
| Review (3 teammates) | 100K-200K | haiku for all |

**Warning:** Teams use significantly more tokens than subagents. Use only when parallel discussion adds clear value.

## Limitations (Experimental)

- No session resumption for in-process teammates
- One team per session
- No nested teams (teammates can't spawn their own teams)
- Lead is fixed for team lifetime
- Permissions inherited from lead at spawn
- Task status can lag — check manually if stuck
- Split panes not supported in VS Code terminal, Windows Terminal, or Ghostty

## Related Files

| File | Purpose |
|------|---------|
| `.claude/skills/agent-teams/SKILL.md` | Skill definition with full templates |
| `.claude/skills/agent-teams/references/` | Official docs reference |
| `.claude/rules/orchestration-protocol.md` | Decision matrix, file ownership rules |
| `.claude/hooks/session-init.cjs` | Team detection and env injection |

## Quick Start

1. Ensure `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set
2. Tell Claude: `/team research "how should we optimize our database queries?"`
3. Watch 3 researchers investigate in parallel
4. Lead synthesizes findings into actionable report
5. Team auto-cleans up when done
