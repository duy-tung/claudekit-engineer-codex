# Quality Gate Rules

Rules for contributors and AI agents working on the claudekit-engineer repo. These are NOT shipped to end users.

## Metadata Deletions (MANDATORY)

When renaming or deleting ANY file under `claude/` directory (skills, hooks, agents, scripts), you MUST add the old relative path to `claude/metadata.json` `deletions[]` array. This tells the CLI installer to remove stale files from user machines during upgrade. Forgetting this leaves orphaned files that cause conflicts.

**Affected files:** `claude/metadata.json`

## Skill Registry Contract

Canonical skill names live in each `claude/skills/*/SKILL.md` frontmatter `name:` field. All cross-references in markdown files MUST use exact registered names with `/ck:` prefix. Before adding a new skill name, check for collisions with Claude Code built-in commands (`/help`, `/clear`, `/debug`, `/plan`, `/compact`, `/review`, `/search`). When renaming a skill, update ALL cross-references in the same PR.

## Statusline Changes

Changes to `statusline*.cjs` or `statusline-*.cjs` MUST update snapshot tests. Run test suite with all config variants: minimal config, full config, custom lines, no quota, 1M context window. ANSI escape sequences and special characters (NBSP) must be explicitly tested.
