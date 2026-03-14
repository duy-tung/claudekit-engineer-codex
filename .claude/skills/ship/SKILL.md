---
name: ck:ship
description: "Ship pipeline: merge main, test, review, commit, push, PR. Single command from feature branch to PR URL."
argument-hint: "[--skip-tests] [--skip-review] [--dry-run]"
license: MIT
metadata:
  author: claudekit
  version: "1.0.0"
---

# Ship: Unified Ship Pipeline

Single command to ship a feature branch. Fully automated — only stops for test failures, critical review issues, or major version bumps.

**Inspired by:** gstack `/ship` by Garry Tan. Adapted for framework-agnostic, multi-language support.

## Arguments

| Flag | Effect |
|------|--------|
| (none) | Full pipeline: merge → test → review → version → changelog → commit → push → PR |
| `--skip-tests` | Skip test step (use when tests already passed) |
| `--skip-review` | Skip pre-landing review step |
| `--dry-run` | Show what would happen without executing |

## When to Stop (blocking)

- On `main`/`master` branch → abort
- Merge conflicts that can't be auto-resolved → stop, show conflicts
- Test failures → stop, show failures
- Critical review issues → AskUserQuestion per issue
- Major/minor version bump needed → AskUserQuestion

## When NOT to Stop

- Uncommitted changes → always include them
- Patch version bump → auto-decide
- Changelog content → auto-generate
- Commit message → auto-compose
- No version file → skip version step silently
- No changelog → skip changelog step silently

## Pipeline

```
Step 1: Pre-flight     → Branch check, status, diff analysis
Step 2: Merge main     → Fetch + merge origin/main
Step 3: Run tests      → Auto-detect test runner, run, check results
Step 4: Review         → Two-pass checklist review (critical + informational)
Step 5: Version bump   → Auto-detect version file, bump patch/minor
Step 6: Changelog      → Auto-generate from commits + diff
Step 7: Commit         → Conventional commit with version/changelog
Step 8: Push           → git push -u origin <branch>
Step 9: Create PR      → gh pr create with structured body
```

**Detailed steps:** Load `references/ship-workflow.md`
**Auto-detection:** Load `references/auto-detect.md`
**PR template:** Load `references/pr-template.md`

## Quick Start

User says `/ck:ship` → run full pipeline → output PR URL.

That's it. The goal is: user says `/ship`, next thing they see is the PR URL.

## Output Format

```
✓ Pre-flight: branch feature/foo, 5 commits, +200/-50 lines
✓ Merged: origin/main (up to date)
✓ Tests: 42 passed, 0 failed
✓ Review: 0 critical, 2 informational
✓ Version: 1.2.3 → 1.2.4
✓ Changelog: updated
✓ Committed: feat(auth): add OAuth2 login flow
✓ Pushed: origin/feature/foo
✓ PR: https://github.com/org/repo/pull/123
```

## Important Rules

- **Never skip tests** (unless `--skip-tests`). If tests fail, stop.
- **Never force push.** Regular `git push` only.
- **Never ask for confirmation** except for critical review issues and major/minor version bumps.
- **Auto-detect everything.** Test runner, version file, changelog format — detect from project files.
- **Framework-agnostic.** Works for Node, Python, Rust, Go, Ruby, Java, or any project with a test command.
- **Subagent delegation.** Use `tester` agent for tests, `code-reviewer` agent for review. Don't inline.
