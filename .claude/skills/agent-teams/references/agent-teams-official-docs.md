# Agent Teams — Official Documentation Reference

Source: https://code.claude.com/docs/en/agent-teams (Claude Code 2.1.32)

## Enabling

```json
// settings.json
{ "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" } }
```

## Architecture

| Component | Role |
|-----------|------|
| Team lead | Main session that creates team, spawns teammates, coordinates |
| Teammates | Separate Claude Code instances with own context windows |
| Task list | Shared work items at `~/.claude/tasks/{team-name}/` |
| Mailbox | Messaging system for inter-agent communication |
| Team config | `~/.claude/teams/{team-name}/config.json` |

## Key Tools

| Tool | Purpose |
|------|---------|
| `Teammate(operation: "spawnTeam")` | Create a team |
| `Task(team_name: ..., name: ...)` | Spawn a teammate into the team |
| `TaskCreate` | Create shared tasks |
| `TaskUpdate` | Update task status, set dependencies |
| `TaskList` | View all tasks |
| `SendMessage(type: "message")` | DM a specific teammate |
| `SendMessage(type: "broadcast")` | Message all teammates (use sparingly) |
| `SendMessage(type: "shutdown_request")` | Ask teammate to shut down |
| `Teammate(operation: "cleanup")` | Remove team resources |

## Context & Communication

- Each teammate loads: CLAUDE.md, MCP servers, skills, agents
- Teammates do NOT inherit lead's conversation history
- Messages delivered automatically (no polling needed)
- Idle notifications sent when teammates finish turns
- Shared task list visible to all agents

## Plan Approval Mode

Teammates can be spawned with `mode: "plan"` to require plan approval:
1. Teammate works in read-only plan mode
2. Sends plan approval request to lead
3. Lead approves → teammate exits plan mode and implements
4. Lead rejects with feedback → teammate revises plan

## Display Modes

- `"in-process"` — all in one terminal (default)
- `"tmux"` / `"auto"` — split panes (requires tmux or iTerm2)

## Limitations

- No session resumption for in-process teammates
- One team per session
- No nested teams
- Lead is fixed for lifetime
- Permissions inherited from lead at spawn
