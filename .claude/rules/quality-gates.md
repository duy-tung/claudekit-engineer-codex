# Quality Gate Rules

Rules for contributors and AI agents working on the claudekit-engineer repo. These are NOT shipped to end users.

> **No CI in this kit.** The lean refactor removed the GitHub Actions workflows, the root `scripts/` JS linters (`check-skill-cross-refs.js`, `check-skill-routing.js`, `check-skill-descriptions.js`), and the allowlist machinery. The gates below are now **local, manual checks** — run the surviving validators in `claude/scripts/` before you commit. Nothing enforces them automatically, so treat them as self-imposed blockers.

## Metadata Deletions (MANDATORY)

When renaming or deleting ANY file under `claude/` directory (skills, hooks, agents, scripts), you MUST add the old relative path to `claude/metadata.json` `deletions[]` array. This tells the CLI installer to remove stale files from user machines during upgrade. Forgetting this leaves orphaned files that cause conflicts.

**Affected files:** `claude/metadata.json`

## Skill Registry Contract

Canonical skill names live in each `claude/skills/*/SKILL.md` frontmatter `name:` field. All cross-references in markdown files MUST use exact registered names with `/ck:` prefix. Before adding a new skill name, check for collisions with Claude Code built-in commands (`/help`, `/clear`, `/debug`, `/plan`, `/compact`, `/review`, `/search`). When renaming a skill, update ALL cross-references in the same PR.

## Skill Cross-Reference Integrity (run before committing)

`claude/scripts/validate-skill-crossrefs.py` builds a registry from all `claude/skills/*/SKILL.md` frontmatter `name:` fields and audits every `/ck:` reference in `claude/**/*.md` — reporting broken refs, orphans, hubs, and workflow-chain gaps.

**Critical rule: use REGISTERED names, not directory names.**

The registry normalizes names by stripping the `ck:` prefix from frontmatter. So `name: ck:debug` registers as `debug`. The reference `/ck:debug` captures `debug` → match. But `/ck:ck-debug` captures `ck-debug` → **no match, validator flags it**.

| Directory Name | Frontmatter `name:` | Registered As | Correct Reference |
|----------------|---------------------|---------------|-------------------|
| `ck-debug` | `ck:debug` | `debug` | `/ck:debug` |
| `ck-plan` | `ck:plan` | `plan` | `/ck:plan` |
| `ck-security` | `ck:security` | `security` | `/ck:security` |
| `cook` | `ck:cook` | `cook` | `/ck:cook` |
| `brainstorm` | `ck:brainstorm` | `brainstorm` | `/ck:brainstorm` |

**Before committing any `/ck:` reference**, verify the name resolves:
```bash
python3 claude/scripts/validate-skill-crossrefs.py claude/skills/
```

**When modifying workflow routing rules** (`claude/rules/skill-workflow-routing.md`, `claude/rules/skill-domain-routing.md`):
- These rules ARE shipped to end users — they guide Claude's skill suggestions
- Keep every `/ck:` reference resolvable (the validator above flags dangling ones)
- When adding a new skill to a workflow chain, update BOTH the routing rule AND the skill's `## Workflow Position` section

**Affected files:** `claude/rules/skill-*.md`, `claude/skills/*/SKILL.md`, `claude/scripts/validate-skill-crossrefs.py`

## Skill Routing Coverage (run before committing)

`validate-skill-crossrefs.py` also reports **orphaned skills** — shipped `ck:*` skills that no routing file (`skill-domain-routing.md` / `skill-workflow-routing.md`) reaches. There is no separate routing-coverage script or allowlist file anymore; reachability is a judgment call you make from the orphan list the validator prints.

**The principle (audit-route-reframe):** discoverability is part of the contract. Shipping a skill that no routing file mentions means users (and Claude) will not find it. **Telemetry zero ≠ zero value** — most dormant skills audited under epic #711 flipped to KEEP after routing or description fixes. When tempted to delete a "dormant" skill:

1. **Audit:** Does the skill have unique capability (scripts, references, agents)? If yes, deletion likely loses real value.
2. **Route:** Is it reachable from a routing file? If no, dormancy is a discoverability problem — fix the routing.
3. **Reframe:** Does the SKILL.md `description` read like a maintainer-only utility? Rewrite with user-phrasing keywords.

Delete only when: (a) audit confirms zero unique capability, AND (b) routing fix wouldn't change adoption, AND (c) use case is genuinely covered by another skill. Catalog size is an output, not a target.

**When adding a new skill:**
1. Add the skill to the appropriate domain block in `skill-domain-routing.md` (preferred — user-facing)
2. OR add it to a workflow chain in `skill-workflow-routing.md`
3. Genuine meta / orchestrator / maintainer skills may stay orphaned by design — document why in the skill's own SKILL.md body (the allowlist files that used to record this were removed with CI).

**When deleting a skill:**
- Re-run the validator and remove every now-dangling `/ck:` reference in the same change.

**Affected files:** `claude/rules/skill-domain-routing.md`, `claude/rules/skill-workflow-routing.md`, `claude/skills/*/SKILL.md`

## Skill Description and Listing Policy

`python3 claude/scripts/validate-skill-frontmatter.py` is the frontmatter contract. It validates every `SKILL.md` against `claude/schemas/skill-schema.json`, requires `user-invocable: true`, and rejects `disable-model-invocation: true` for shipped skills. Run it standalone:

```bash
python3 claude/scripts/validate-skill-frontmatter.py
```

`claude/scripts/score-skill-description.py` (invoked by `scan_skills.py`) scores each description on structural format criteria and flags confusable skill pairs (Jaccard similarity) and dependency cycles. It measures FORMAT COMPLIANCE (structure), not semantic effectiveness.

Description guidance — keep frontmatter as a tight routing signal:

- Lead with a capability / action verb, not "Use this when…" (instructional phrasing reads worse for routing)
- Keep descriptions roughly between 50 and 512 characters
- No TODO / FIXME / WIP or maintainer-only markers (`[KAI]`, `maintainer-only`) in a shipped description
- After changing any description, regenerate the catalog: `python3 claude/scripts/scan_skills.py` (rewrites `guide/SKILLS.md` and `guide/SKILLS.yaml`)

Listing pressure is managed through project settings, not a lint:

- `skillListingBudgetFraction` (currently `0.04`) and `skillListingMaxDescChars` (currently `512`) in `claude/settings.json` keep the shipped-skill listing within budget. Keep both set; tighten descriptions rather than hiding skills — do not add `skillOverrides`.

**Affected files:** `claude/scripts/validate-skill-frontmatter.py`, `claude/scripts/score-skill-description.py`, `claude/scripts/scan_skills.py`, `claude/settings.json`

## Statusline Changes

Changes to `statusline*.cjs` or `statusline-*.cjs` MUST update snapshot tests. Run test suite with all config variants: minimal config, full config, custom lines, no quota, 1M context window. ANSI escape sequences and special characters (NBSP) must be explicitly tested.
