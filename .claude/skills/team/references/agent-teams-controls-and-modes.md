# Agent Teams — Controls, Display Modes & Task Management

> **Source:** https://code.claude.com/docs/en/agent-teams

## Display Modes

- **In-process** (default fallback): all teammates in one terminal. `Shift+Up/Down` to navigate. Works in any terminal.
- **Split panes**: each teammate gets own pane. Requires tmux or iTerm2.

Default is `"auto"` — uses split panes if already inside a tmux session, otherwise in-process. The `"tmux"` setting enables split-pane mode and auto-detects tmux vs iTerm2.

```json
{ "teammateMode": "in-process" }
```

Per-session override: `claude --teammate-mode in-process`

Split panes NOT supported in: VS Code terminal, Windows Terminal, Ghostty.

**tmux setup:** install via system package manager.
**iTerm2 setup:** install `it2` CLI, enable Python API in iTerm2 > Settings > General > Magic.

## Specify Teammates & Models

Claude decides teammate count based on task, or you specify:

```
Create a team with 4 teammates to refactor these modules in parallel.
Use Sonnet for each teammate.
```

## Plan Approval

Require teammates to plan before implementing:

```
Spawn an architect teammate to refactor the auth module.
Require plan approval before they make any changes.
```

**Flow:**
1. Teammate works in read-only plan mode
2. Teammate finishes planning → sends `plan_approval_request` to lead
3. Lead reviews → approves via `SendMessage(type: "plan_approval_response", approve: true)`
4. If rejected: teammate stays in plan mode, revises based on feedback, resubmits
5. Once approved: teammate exits plan mode, begins implementation

**Influence criteria:** "only approve plans that include test coverage" or "reject plans that modify the database schema"

## Delegate Mode

Restricts lead to coordination-only tools: spawning, messaging, shutting down teammates, and managing tasks. No code editing.

Useful when lead should focus entirely on orchestration — breaking down work, assigning tasks, synthesizing results.

**Enable:** Press `Shift+Tab` after team creation to cycle into delegate mode.

## Direct Teammate Interaction

- **In-process**: `Shift+Up/Down` select teammate, type to message. `Enter` view session. `Escape` interrupt current turn. `Ctrl+T` toggle task list.
- **Split panes**: click into pane to interact directly. Each teammate has full terminal view.

## Task Assignment & Claiming

Three states: **pending** → **in_progress** → **completed**. Tasks can have dependencies — blocked until dependencies resolve.

- **Lead assigns**: tell lead which task → which teammate
- **Self-claim**: after finishing, teammate picks next unassigned, unblocked task automatically

File locking prevents race conditions on simultaneous claiming.

Task dependencies managed automatically — completing a blocking task unblocks dependents.

## Shutdown

```
Ask the researcher teammate to shut down
```

Teammate can approve (exit) or reject with explanation. Teammates finish current request/tool call before shutting down — can be slow.

## Cleanup

Ask lead to clean up after all teammates shut down. Fails if active teammates still exist.

Removes shared team resources (`~/.claude/teams/` and `~/.claude/tasks/` entries).
