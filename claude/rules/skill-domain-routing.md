# Skill Domain Routing

When a user's task involves a specific domain, use these decision trees to pick the RIGHT skill based on user intent.

## Codebase Understanding

```
User wants to...
├── Quick file search, locate specific code     → /ck:scout
├── Onboard a new repo / dump codebase for LLM  → /ck:repomix
├── Semantic go-to-definition, find-usages      → /ck:gkg
└── Build a queryable knowledge graph from code → /ck:graphify
```

## Agent Harness (project agent-readiness)

```
User wants to...
├── Scaffold harness files for a repo (AGENTS.md, feature-list, init.sh) → /ck:harness
└── Audit / score a repo's agent-readiness and fix the weakest subsystem → /ck:harness
```

## Security

```
User wants to...
├── STRIDE/OWASP security audit with auto-fix    → /ck:security
└── Scan for secrets, vulnerabilities, OWASP patterns → /ck:security-scan
```

## AI / LLM

```
User wants to...
├── Optimize context, agent architecture, memory → /ck:context-engineering
└── Learn the autoresearch pattern / find the right family member → /ck:autoresearch
```

## MCP (Model Context Protocol)

```
User wants to...
├── Build a new MCP server                       → /ck:mcp-builder
├── Convert existing code into CLI/MCP server    → /ck:agentize
└── Discover and execute MCP tools               → /ck:use-mcp
```

## Testing

```
User wants to...
└── Run test suites, coverage reports, TDD       → /ck:test
```

## Documentation

```
User wants to...
├── Update project docs (codebase-summary, PDR)   → /ck:docs
├── Discover skills by capability / "is there a skill" → /ck:find-skills
├── Publish-grade SVG/PNG diagrams (architecture) → /ck:tech-graph
├── Generate session hand-off / EOD summary       → /ck:watzup
└── Sprint retrospective from git history         → /ck:retro
```

## Documents / Office Files

```
User wants to...
├── Create / edit / extract from .docx (Word)         → /ck:docx
├── Create / edit / extract from .pdf (forms, tables) → /ck:pdf
├── Create / edit / extract from .pptx (PowerPoint)   → /ck:pptx
└── Create / edit / extract from .xlsx (spreadsheets) → /ck:xlsx
```

## Usage Notes

- Pick ONE skill per distinct user intent
- Domain skills combine with core workflow: `/ck:plan` → domain skill → `/ck:cook`
- Skills not listed here are either core workflow skills (see `skill-workflow-routing.md`) or utility skills activated on demand (e.g. `/ck:ask`, `/ck:preview`, `/ck:sequential-thinking`)
