---
name: ck:docs
description: "Analyze codebase and manage project documentation. Use for doc initialization, updates, summaries, codebase analysis."
category: utilities
keywords: [documentation, init, update, summarize]
argument-hint: "init|update|summarize"
metadata:
  author: claudekit
  version: "1.1.0"
  attribution: "SVG layout cross-reference pattern adapted from fireworks-tech-graph by yizhiyanhua-ai (MIT)"
  license: MIT
---

# Documentation Management

Analyze codebase and manage project documentation through scouting, analysis, and structured doc generation.

**IMPORTANT:** Invoke "/ck:project-organization" skill to organize the outputs.

## Default (No Arguments)

If invoked without arguments, use `AskUserQuestion` to present available documentation operations:

| Operation | Description |
|-----------|-------------|
| `init` | Analyze codebase & create initial docs |
| `update` | Analyze changes & update docs |
| `summarize` | Quick codebase summary |

Present as options via `AskUserQuestion` with header "Documentation Operation", question "What would you like to do?".

## Subcommands

| Subcommand | Reference | Purpose |
|------------|-----------|---------|
| `/ck:docs init` | `references/init-workflow.md` | Analyze codebase and create initial documentation |
| `/ck:docs update` | `references/update-workflow.md` | Analyze codebase and update existing documentation |
| `/ck:docs summarize` | `references/summarize-workflow.md` | Quick analysis and update of codebase summary |

## Routing

Parse `$ARGUMENTS` first word:
- `init` → Load `references/init-workflow.md`
- `update` → Load `references/update-workflow.md`
- `summarize` → Load `references/summarize-workflow.md`
- empty/unclear → AskUserQuestion (do not auto-run `init`)

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

When authoring or refreshing diagrams in `system-architecture.md`, apply the universal SVG layout rules from `/ck:mermaidjs-v11`'s `references/svg-layout-from-fireworks.md` (component spacing, arrow routing, label placement, z-index ordering). Pair with `/ck:preview --diagram` for visual self-review before committing.

**IMPORTANT**: **Do not** start implementing code.
