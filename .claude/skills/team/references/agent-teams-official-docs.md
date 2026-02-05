# Agent Teams — Overview & Architecture

> **Canonical source:** https://code.claude.com/docs/en/agent-teams
> **Version captured:** Claude Code 2.1.32 (Feb 2026)
> **Update policy:** Re-fetch canonical URL when Claude Code releases new Agent Teams features.

This is a **self-contained knowledge base** — AI agents should NOT need to re-fetch the URL.

## Overview

Agent Teams coordinate multiple Claude Code instances working together. One session acts as the team lead, coordinating work, assigning tasks, and synthesizing results. Teammates work independently, each in its own context window, and communicate directly with each other.

Unlike subagents (run within a single session, report back only), teammates are full independent sessions you can interact with directly.

## When to Use

Best for tasks where parallel exploration adds real value:

- **Research and review**: multiple teammates investigate different aspects, share and challenge findings
- **New modules or features**: teammates each own a separate piece without conflicts
- **Debugging with competing hypotheses**: test different theories in parallel
- **Cross-layer coordination**: changes spanning frontend, backend, tests — each owned by different teammate

**Not suitable for:** sequential tasks, same-file edits, work with many dependencies.

### Subagents vs Agent Teams

| | Subagents | Agent Teams |
|---|---|---|
| **Context** | Own window; results return to caller | Own window; fully independent |
| **Communication** | Report back to main agent only | Message each other directly |
| **Coordination** | Main agent manages all work | Shared task list, self-coordination |
| **Best for** | Focused tasks, result-only | Complex work requiring discussion |
| **Token cost** | Lower | Higher (each teammate = separate instance) |

## Enable

```json
{ "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" } }
```

## Architecture

| Component | Role |
|-----------|------|
| **Team lead** | Main session — creates team, spawns teammates, coordinates |
| **Teammates** | Separate Claude Code instances with own context windows |
| **Task list** | Shared work items at `~/.claude/tasks/{team-name}/` |
| **Mailbox** | Messaging system for inter-agent communication |

Storage:
- **Team config**: `~/.claude/teams/{team-name}/config.json` (members array with name, agent ID, type)
- **Task list**: `~/.claude/tasks/{team-name}/`

## How Teams Start

1. **You request**: describe task + ask for agent team
2. **Claude proposes**: suggests team if task benefits from parallel work

Both require your confirmation.

## Context & Communication

Each teammate loads: CLAUDE.md, MCP servers, skills, agents. Receives spawn prompt from lead. Lead's conversation history does NOT carry over.

- **Automatic message delivery** — no polling needed
- **Idle notifications** — teammates notify lead when finished
- **Shared task list** — all agents see status and claim work

Messaging types:
- `message` — send to one teammate
- `broadcast` — send to all (use sparingly, costs scale)

## Permissions

Teammates inherit lead's permission settings at spawn. Can change individually after spawning but not at spawn time.

## Token Usage

Scales with active teammates. Worth it for research/review/features. Single session more cost-effective for routine tasks.
