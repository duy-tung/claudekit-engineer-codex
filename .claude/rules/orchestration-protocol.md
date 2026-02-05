# Orchestration Protocol

## Delegation Context (MANDATORY)

When spawning subagents via Task tool, **ALWAYS** include in prompt:

1. **Work Context Path**: The git root of the PRIMARY files being worked on
2. **Reports Path**: `{work_context}/plans/reports/` for that project
3. **Plans Path**: `{work_context}/plans/` for that project

**Example:**
```
Task prompt: "Fix parser bug.
Work context: /path/to/project-b
Reports: /path/to/project-b/plans/reports/
Plans: /path/to/project-b/plans/"
```

**Rule:** If CWD differs from work context (editing files in different project), use the **work context paths**, not CWD paths.

---

#### Sequential Chaining
Chain subagents when tasks have dependencies or require outputs from previous steps:
- **Planning → Implementation → Simplification → Testing → Review**: Use for feature development (tests verify simplified code)
- **Research → Design → Code → Documentation**: Use for new system components
- Each agent completes fully before the next begins
- Pass context and outputs between agents in the chain

#### Parallel Execution
Spawn multiple subagents simultaneously for independent tasks:
- **Code + Tests + Docs**: When implementing separate, non-conflicting components
- **Multiple Feature Branches**: Different agents working on isolated features
- **Cross-platform Development**: iOS and Android specific implementations
- **Careful Coordination**: Ensure no file conflicts or shared resource contention
- **Merge Strategy**: Plan integration points before parallel execution begins

---

## Agent Teams (Experimental)

Agent Teams coordinate multiple **independent Claude Code sessions** with shared task lists and inter-agent messaging. Unlike subagents, teammates have their own context windows, can message each other directly, and self-coordinate.

**Requires:** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in settings.json env.

### When to Use Agent Teams vs Subagents

| Scenario | Subagents (Task) | Agent Teams |
|----------|-----------------|-------------|
| Focused task (test, lint, single review) | **Yes** | Overkill |
| Sequential chain (plan → code → test) | **Yes** | No |
| 3+ independent parallel workstreams | Maybe | **Yes** |
| Competing debug hypotheses | No | **Yes** |
| Cross-layer work (FE + BE + tests) | Maybe | **Yes** |
| User wants to steer individual workers | No | **Yes** |
| Token budget is tight | **Yes** | No |
| Workers need to discuss/challenge findings | No | **Yes** |

**Default:** Subagents remain the primary delegation method. Agent Teams are for complex parallel work where inter-agent discussion adds value.

### Predefined Team Templates

Activate via `/team` skill:
- `/team research <topic>` — 3 researchers, different angles, lead synthesizes
- `/team implement <plan>` — Planner + devs + tester, plan approval required
- `/team review <scope>` — Security + performance + test coverage reviewers

### File Ownership (CRITICAL)

When using Agent Teams for implementation, each teammate **MUST** own distinct files. No two teammates edit the same file — this prevents overwrites.

Define ownership in task descriptions:
```
Task: "Implement API endpoints"
File ownership: src/api/*, src/models/*
```

See `.claude/skills/team/SKILL.md` for full template details.