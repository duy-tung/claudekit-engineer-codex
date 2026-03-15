---
name: adversarial-review
description: Always-on Stage 3 red-team review that actively tries to break code — finds security holes, false assumptions, failure modes, race conditions. Spawns adversarial reviewer subagent with destructive mindset.
---

# Adversarial Review (Stage 3)

**Always-on.** Runs after every Stage 2 (Code Quality) pass. No exceptions, no opt-out.

## Mindset

> "You are hired to tear apart the implementer's work. Your job is to find every way this code can fail, be exploited, or produce incorrect results. Assume the implementer made mistakes. Prove it."

This is NOT a standard code review. Standard reviews check if code meets requirements. Adversarial review assumes requirements are met and asks: **"How can this still break?"**

## What to Attack

### Security Holes
- Injection vectors (SQL, command, XSS, template)
- Auth bypass paths (missing checks, privilege escalation)
- Secrets exposure (logs, error messages, stack traces)
- Input trust boundaries (user input treated as safe)
- SSRF, path traversal, deserialization attacks

### False Assumptions
- "This will never be null" — prove it can be
- "This list always has elements" — find the empty case
- "Users always call A before B" — find the out-of-order path
- "This config value exists" — find the missing env var
- "This third-party API always returns 200" — find the failure mode

### Failure Modes
- What happens when disk is full?
- What happens when network times out mid-operation?
- What happens when two requests hit the same resource simultaneously?
- What happens when the database connection drops during a transaction?
- What happens when input is 10x larger than expected?

### Race Conditions
- Shared mutable state without locks
- Time-of-check-to-time-of-use (TOCTOU)
- Async operations with implicit ordering assumptions
- Cache invalidation during concurrent writes
- File system operations without atomic guarantees

### Data Corruption
- Partial writes on failure (no transaction/rollback)
- Type coercion surprises (string "0" as falsy)
- Floating point comparison for equality
- Timezone-naive datetime operations
- Encoding mismatches (UTF-8 vs Latin-1)

## Process

### 1. Spawn Adversarial Reviewer

Dispatch `code-reviewer` subagent with adversarial prompt:

```
You are an adversarial code reviewer. Your ONLY job is to find ways this code
can fail, be exploited, or produce incorrect results.

DO NOT praise the code. DO NOT note what works well.
ONLY report problems. If you find nothing, say "No findings" — but try harder first.

Review this diff:
{DIFF}

Changed files: {FILES}

Attack vectors to check:
1. Security holes (injection, auth bypass, secrets exposure)
2. False assumptions (null, empty, ordering, config)
3. Failure modes (disk, network, timeout, resource exhaustion)
4. Race conditions (shared state, TOCTOU, async ordering)
5. Data corruption (partial writes, type coercion, encoding)

For each finding, report:
- SEVERITY: Critical / Medium / Low
- CATEGORY: Security / Assumption / Failure / Race / Data
- LOCATION: file:line
- ATTACK: How to trigger the problem
- IMPACT: What happens when triggered
- FIX: Concrete fix (not "add validation" — show the code)
```

### 2. Adjudicate Findings

Main agent reviews each adversarial finding and assigns verdict:

| Verdict | Meaning | Action |
|---------|---------|--------|
| **Accept** | Valid flaw, reproducible or clearly reasoned | Must fix before merge |
| **Reject** | False positive, already handled, or impossible path | Document why, no action |
| **Defer** | Valid but low-risk, tracked for later | Note in review, non-blocking |

**Rules:**
- Every finding gets a verdict — no silent dismissals
- Critical findings: Accept unless you can PROVE false positive
- Benefit of doubt goes to the adversary (safer to fix than to dismiss)
- If >50% of findings are Rejected, the adversary was too aggressive — but still report all

### 3. Report Format

```
## Adversarial Review — Stage 3

### Summary
- Findings: N total (X Critical, Y Medium, Z Low)
- Accepted: A (must fix)
- Rejected: B (false positive)
- Deferred: C (tracked)

### Accepted Findings (Must Fix)

#### [1] SEVERITY — CATEGORY — file:line
**Attack:** How to trigger
**Impact:** What happens
**Fix:** Concrete fix
**Verdict:** Accept — [reason]

### Rejected Findings

#### [N] SEVERITY — CATEGORY — file:line
**Attack:** Claimed vector
**Verdict:** Reject — [reason this is a false positive]

### Deferred Findings

#### [N] SEVERITY — CATEGORY — file:line
**Attack:** How to trigger
**Verdict:** Defer — [reason for deferral, tracking note]
```

### 4. Fix Accepted Findings

- Critical: Block merge. Fix immediately via `/fix` or manual edit.
- Medium: Fix before merge if feasible. Defer only with explicit user approval.
- Low: Track. Fix in follow-up if pattern repeats.

## Integration with Pipeline

```
Stage 1 (Spec) → PASS
  ↓
Stage 2 (Quality) → PASS
  ↓
Stage 3 (Adversarial) → findings
  ├─ 0 Accepted → PASS → proceed
  ├─ Accepted Critical → BLOCK → fix → re-run Stage 3
  └─ Accepted Medium/Low only → fix or defer → proceed
```

**Task pipeline update:** When using task-managed reviews, adversarial review gets its own task between "Review implementation" and "Fix critical issues".

## What This Is NOT

- NOT a style review (Stage 2 handles that)
- NOT a spec compliance check (Stage 1 handles that)
- NOT a general "suggestions for improvement" pass
- NOT optional or skip-able

This is a focused, hostile attempt to break the code. If the code survives, it's ready to ship.
