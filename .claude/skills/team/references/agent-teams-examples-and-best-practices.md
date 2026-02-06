# Agent Teams — Examples, Best Practices & Troubleshooting

> **Source:** https://code.claude.com/docs/en/agent-teams

## Use Case Examples

### Parallel Code Review

```
Create an agent team to review PR #142. Spawn three reviewers:
- One focused on security implications
- One checking performance impact
- One validating test coverage
Have them each review and report findings.
```

Each reviewer applies different filter to same PR. Lead synthesizes across all three.

### Competing Hypotheses Investigation

```
Users report the app exits after one message instead of staying connected.
Spawn 5 agent teammates to investigate different hypotheses. Have them talk to
each other to try to disprove each other's theories, like a scientific
debate. Update the findings doc with whatever consensus emerges.
```

Adversarial debate structure fights anchoring bias — surviving theory is most likely correct.

### Parallel Feature Implementation

```
Create a team to implement the new dashboard feature.
Developer A owns src/api/* and src/models/*.
Developer B owns src/components/* and src/pages/*.
Tester writes tests after both devs finish.
Require plan approval for developers.
```

Each developer works in isolation. Tester blocked until both complete.

## Best Practices

### Give Enough Context

Teammates don't inherit lead's conversation. Include details in spawn prompt:

```
Spawn a security reviewer with prompt: "Review src/auth/ for vulnerabilities.
Focus on token handling, session management, input validation.
App uses JWT in httpOnly cookies. Report with severity ratings."
```

### Size Tasks Right

- **Too small**: coordination overhead exceeds benefit
- **Too large**: teammates work too long without check-ins
- **Right**: self-contained units with clear deliverable (function, test file, review)

### Start with Research/Review

If new to agent teams, start with read-only tasks (reviewing PRs, researching libraries, investigating bugs). Shows parallel value without coordination challenges of parallel implementation.

### Wait for Teammates

If lead starts implementing instead of delegating:
```
Wait for your teammates to complete their tasks before proceeding
```

### Avoid File Conflicts

Two teammates editing same file = overwrites. Each teammate must own distinct files. If shared file needed, lead handles it or restructure tasks.

### Use Git Worktrees for Implementation Teams

For implementation teams with multiple developers editing code:
1. Create a worktree per developer: `git worktree add ../worktrees/<dev-name> -b <branch>`
2. Each developer works in their own worktree — eliminates git conflicts
3. Lead merges worktree branches after completion
4. Cleanup: `git worktree remove ../worktrees/<dev-name>`

This is the safest pattern for parallel code changes.

### Monitor & Steer

Check progress regularly. Redirect bad approaches. Synthesize findings as they arrive. Letting a team run unattended too long increases wasted effort risk.

### File Ownership Enforcement

- Define explicit file boundaries in each task description
- Include glob patterns: `File ownership: src/api/*, src/models/*`
- If two tasks need same file: escalate to lead, restructure, or have lead handle directly
- Tester owns test files only; reads implementation files but never edits them

## Token Budget Guidance

| Template | Estimated Tokens | Model Strategy |
|----------|-----------------|----------------|
| Research (3 teammates) | ~150K-300K | haiku for all researchers |
| Implement (4 teammates) | ~400K-800K | sonnet for devs, haiku for tester |
| Review (3 teammates) | ~100K-200K | haiku for all reviewers |
| Debug (3 teammates) | ~200K-400K | sonnet for debuggers |

Agent Teams use significantly more tokens than subagents. Use only when parallel exploration + discussion adds clear value. For routine tasks, single session is more cost-effective.

## Troubleshooting

### Teammates Not Appearing

- In-process: press `Shift+Down` to cycle through active teammates
- Task may not be complex enough — Claude decides based on task
- Split panes: verify tmux installed and in PATH
- iTerm2: verify `it2` CLI installed and Python API enabled

### Too Many Permission Prompts

Pre-approve common operations in permission settings before spawning.

### Teammates Stopping on Errors

Check output via `Shift+Up/Down` or clicking pane. Give additional instructions or spawn replacement.

### Lead Shuts Down Early

Tell lead to keep going or wait for teammates.

### Orphaned tmux Sessions

```
tmux ls
tmux kill-session -t <session-name>
```

## Limitations

- **No session resumption**: `/resume` and `/rewind` don't restore in-process teammates
- **Task status can lag**: teammates may not mark tasks completed; check manually
- **Shutdown can be slow**: finishes current request first
- **One team per session**: clean up before starting new one
- **No nested teams**: only lead manages team
- **Lead is fixed**: can't promote teammate or transfer leadership
- **Permissions at spawn**: all inherit lead's mode; changeable after but not at spawn time
- **Split panes**: require tmux or iTerm2 only
