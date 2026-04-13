---
name: ck:plans-kanban
description: Open the ClaudeKit plans dashboard in the CLI config UI. Use for plan kanban views, progress tracking, timeline checks, and quick navigation into plan files.
category: dev-tools
keywords: [plans, dashboard, kanban, progress, timeline]
argument-hint: "[deprecated flags are accepted with warnings]"
metadata:
  author: claudekit
  version: "2.0.0"
---

# plans-kanban

Thin launcher for the ClaudeKit CLI dashboard plans view.

It opens the integrated dashboard at `http://localhost:3456/plans` instead of starting the legacy standalone server.
If `3456` is already in use, the CLI may auto-fallback to `3457-3460` and the launcher will follow that running port.

## Quick Start

```bash
node .claude/skills/plans-kanban/scripts/open-dashboard.cjs
```

If the dashboard is not already running, the launcher starts:

```bash
ck config ui --port 3456 --no-open
```

Then it opens the plans route in your browser.

## Purpose

Use this skill when you want the visual plans dashboard for:
- Multi-plan kanban and grid views
- Timeline and progress overview
- Navigating into `plan.md` and `phase-*.md` files
- Quick visibility into active vs completed work

## Dashboard Workflow

```bash
# Open the plans dashboard
node .claude/skills/plans-kanban/scripts/open-dashboard.cjs

# Run the dashboard manually if you want to keep it in the foreground
ck config ui --port 3456
```

Primary URL:

```text
http://localhost:3456/plans
```

## Deprecated Compatibility

The old standalone server flags are accepted for compatibility and replaced with guidance:

| Legacy input | Current behavior |
|-------------|------------------|
| `--dir <path>` / positional path | Warns and ignores. The CLI dashboard auto-discovers plans. |
| `--plans <path>` | Warns and ignores. |
| `--port <n>` | Warns and ignores. `plans-kanban` now targets the CLI dashboard starting at `3456` and follows the CLI fallback port if needed. |
| `--host <addr>` | Warns and ignores. Use `ck config ui --host ...` directly if needed. |
| `--background` / `--foreground` | Warns and ignores. The launcher manages its own detached startup flow. |
| `--stop` | Stops the launcher-managed dashboard process if one was started by `plans-kanban`; otherwise prints manual shutdown guidance. |
| `--open` | Accepted. Opening is now the default behavior. |

## Related CLI Commands

```bash
ck config ui                    # Start dashboard
ck config ui --port 3456        # Start on the plans-kanban default port
ck plan status <plan.md>        # Inspect plan progress from CLI
cd /absolute/path/to/plan-dir && ck plan check 1
cd /absolute/path/to/plan-dir && ck plan check 1 --start
cd /absolute/path/to/plan-dir && ck plan uncheck 1
```

## Migration Notes

The legacy standalone server, renderer, and assets have been retired from this skill.

For migration details:

```text
.claude/skills/plans-kanban/deprecated/MIGRATION.md
```

## Troubleshooting

**`ck` not found**
Install the ClaudeKit CLI and confirm `ck --version` works in your shell.

**Dashboard did not open**
Start it manually with `ck config ui --port 3456`, then open `/plans` on whichever port the CLI reports.

**Need to stop a launcher-started dashboard**
Run the launcher again with `--stop`. If the dashboard was started manually, stop the terminal running `ck config ui`.

**Need custom host or different port**
Run `ck config ui` directly with the flags you need. The `plans-kanban` launcher intentionally stays thin and opinionated.
