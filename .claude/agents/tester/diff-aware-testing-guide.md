# Diff-Aware Testing Guide

Reference for tester agent diff-aware mode. Detailed mapping logic and escalation rules.

## Step 1: Get Changed Files

```bash
# Changed files since last commit (unstaged + staged)
git diff --name-only HEAD

# Changed files in a specific commit range
git diff --name-only <base>..<head>

# Staged only
git diff --name-only --cached

# Combined (most useful for pre-push testing)
git diff --name-only HEAD~1 HEAD
```

## Step 2: Map Changed Files to Tests

Priority order — use first strategy that yields results.

### Strategy A: Co-located tests (same directory)

```
src/auth/login.ts         → src/auth/login.test.ts
src/auth/login.ts         → src/auth/__tests__/login.test.ts
src/auth/login.ts         → src/auth/login.spec.ts
```

Pattern: strip extension, append `.test.{ext}` or `.spec.{ext}` in same dir or `__tests__/` subdirectory.

### Strategy B: Mirror directory

```
src/auth/login.ts         → tests/auth/login.test.ts
src/utils/parser.ts       → test/utils/parser.test.ts
lib/core/engine.ts        → spec/core/engine.spec.ts
```

Pattern: replace `src/` or `lib/` prefix with `tests/`, `test/`, or `spec/`.

### Strategy C: Import graph (reverse lookup)

When A and B yield nothing, search for test files that import the changed module:

```bash
# Find test files importing the changed file
grep -r "from.*auth/login" tests/ --include="*.test.*" -l
grep -r "require.*auth/login" tests/ --include="*.spec.*" -l
```

### Strategy D: Config/infrastructure changes

When changed file is config (tsconfig, jest.config, webpack, package.json, etc.):
- Run full suite — config changes can affect any test
- Log reason: "[!] Config file changed — running full suite"

### Strategy E: Shared utility/type files

When changed file is used by 5+ modules (high fan-out):
- Check import count: `grep -r "from.*<module>" src/ --include="*.ts" | wc -l`
- If >5 consumers → escalate to full suite
- Log reason: "[!] High-impact shared module — running full suite"

## Step 3: Auto-Escalation Rules

| Condition | Action |
|-----------|--------|
| 0 tests mapped after all strategies | Warn: "[!] No tests found for changed files" + list unmapped files |
| Config file changed | Full suite + log reason |
| >70% of total tests selected | Full suite (diff mode overhead not worth it) |
| Changed file has >5 importers | Full suite for that module's tests |
| Test infrastructure files changed | Full suite |

## Step 4: Report Format

```
Diff-aware mode: analyzed N changed files
  Changed: src/auth/login.ts, src/utils/parser.ts
  Mapped:  tests/auth/login.test.ts (Strategy A)
           tests/utils/parser.test.ts (Strategy B)
  Unmapped: [none] | src/models/user.ts → [!] no tests found

Ran 12/847 tests (diff-based): 11 passed, 1 failed
```

For `--full` mode:
```
Full suite mode (--full flag): running all 847 tests
Ran 847/847 tests: 846 passed, 1 failed
```

## Common Pitfalls

- Barrel files (`index.ts`) — changes propagate widely; treat as high fan-out
- Generated files — skip mapping, these rarely have direct tests
- Test helper files (`fixtures/`, `mocks/`) — treat as config change, run full suite
- Renamed files — `git diff --name-status` shows R (rename); map both old and new names
