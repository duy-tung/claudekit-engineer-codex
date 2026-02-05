# Agent Teams — Controls, Display Modes & Task Management

> **Source:** https://code.claude.com/docs/en/agent-teams

## Display Modes

- **In-process** (default): all teammates in one terminal. `Shift+Up/Down` to navigate. Works in any terminal.
- **Split panes**: each teammate gets own pane. Requires tmux or iTerm2.

Default `"auto"` — split panes if in tmux, otherwise in-process.

```json
{ "teammateMode": "in-process" }
```

Per-session: `claude --teammate-mode in-process`

Split panes NOT supported in: VS Code terminal, Windows Terminal, Ghostty.

## Specify Teammates & Models

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

Flow: teammate plans → sends approval request → lead approves/rejects → if rejected, revises and resubmits.

Influence criteria: "only approve plans that include test coverage"

## Delegate Mode

Restricts lead to coordination-only (spawning, messaging, tasks — no code). Press `Shift+Tab` after team creation.

## Direct Teammate Interaction

- **In-process**: `Shift+Up/Down` select, type to message. `Enter` view session. `Escape` interrupt. `Ctrl+T` task list.
- **Split panes**: click into pane.

## Task Assignment & Claiming

Three states: **pending** → **in progress** → **completed**. Tasks can have dependencies — blocked until dependencies resolve.

- **Lead assigns**: tell lead which task → which teammate
- **Self-claim**: teammates pick up next unassigned, unblocked task automatically

File locking prevents race conditions on claiming.

## Shutdown

```
Ask the researcher teammate to shut down
```

Teammate can approve (exit) or reject with explanation. Teammates finish current request before shutting down.

## Cleanup

Ask lead to clean up. Fails if active teammates exist — shut them down first.
