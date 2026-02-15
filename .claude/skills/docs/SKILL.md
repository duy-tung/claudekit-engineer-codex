---
name: docs
description: "[CK] Analyze codebase and manage project documentation — init, update, summarize."
argument-hint: "[init|update|summarize] [options]"
---

# Documentation Management

Analyze codebase and manage project documentation through scouting, analysis, and structured doc generation.

## Subcommands

| Subcommand | Reference | Purpose |
|------------|-----------|---------|
| `/docs init` | `references/init-workflow.md` | Analyze codebase and create initial documentation |
| `/docs update` | `references/update-workflow.md` | Analyze codebase and update existing documentation |
| `/docs summarize` | `references/summarize-workflow.md` | Quick analysis and update of codebase summary |

## Routing

Parse `$ARGUMENTS` first word:
- `init` or empty → Load `references/init-workflow.md`
- `update` → Load `references/update-workflow.md`
- `summarize` → Load `references/summarize-workflow.md`

## Shared Context

Documentation lives in `./docs` directory:
```
./docs
├── project-overview-pdr.md
├── code-standards.md
├── codebase-summary.md
├── design-guidelines.md
├── deployment-guide.md
├── system-architecture.md
└── project-roadmap.md
```

Use `docs/` directory as the source of truth for documentation.

**IMPORTANT**: **Do not** start implementing code.
