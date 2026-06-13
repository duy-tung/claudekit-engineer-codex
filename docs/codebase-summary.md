# Codebase Summary

**Last Updated**: 2026-01-28
**Version**: 2.9.0-beta.2
**Repository**: [claudekit/claudekit-engineer](https://github.com/claudekit/claudekit-engineer)

## Overview

ClaudeKit Engineer is a comprehensive boilerplate template for building professional software projects with Claude Code. It provides a complete development environment with AI-powered agent orchestration, automated workflows, and intelligent project management.

## Project Structure

```
claudekit-engineer/
├── .claude/               # Claude Code configuration
│   ├── agents/           # Specialized agent definitions (11 agents)
│   ├── hooks/            # Git hooks and scripts
│   ├── skills/           # Specialized skills library (43 skills)
│   └── rules/            # AI-facing rules and workflows
├── docs/                # Project documentation
│   └── research/        # Research reports directory
├── guide/               # User guides and references
├── plans/               # Implementation plans and reports
│   ├── reports/         # Agent-to-agent communication
│   └── templates/       # Plan templates
├── README.md           # Project overview
├── package.json        # Node.js dependencies
└── repomix-output.xml  # Codebase compaction file
```

## Core Technologies

### Runtime & Dependencies
- **Node.js**: >=18.0.0
- **Package Manager**: npm
- **License**: MIT

### Development Tools
- **Node.js test runner**: `node --test` for the hook test suites
- **Repomix**: Codebase compaction for AI consumption

## Key Components

### 1. Agent Orchestration System (11 Agents)

**Claude Code Agents** (`.claude/agents/`):
- `planner.md` - Technical planning and architecture (Opus model)
- `researcher.md` - Research and analysis
- `code-reviewer.md` - Code quality assessment
- `tester.md` - Testing and validation
- `debugger.md` - Issue analysis and debugging
- `docs-manager.md` - Documentation management (Gemini model)
- `git-manager.md` - Version control operations
- `journal-writer.md` - Development journaling
- `brainstormer.md` - Solution ideation
- `project-manager.md` - Project tracking
- `code-simplifier.md` - Code optimization and simplification

### 2. Slash Commands System (Skill-Backed)

**Core Development Commands**:
- `/ck:plan` - Research and planning (`--deep` for major refactors, `--tdd` for tests-first plans)
- `/ck:cook` - Feature implementation (`--tdd` for tests-first refactors)
- `/ck:test` - Test execution
- `/ck:ask` - Technical consultation
- `/ck:bootstrap` - Project initialization
- `/ck:brainstorm` - Solution ideation
- `/ck:debug` - Issue debugging
- `/ck:fix` - Bug fixes

**Skill Directories** (`.claude/skills/`):
- `bootstrap/` - Project initialization workflows
- `docs/` - Documentation workflows
- `ck-plan/` - Planning variants
- `ck-code-review/` - Code review workflows
- `test/` - Testing workflows

### 3. Skills Library (43 Skills)

**Current Skills** (43 Total):
- agentize, ask, bootstrap, brainstorm, ck-autoresearch
- ck-code-review, ck-debug, ck-graphify, ck-loop, ck-plan
- ck-predict, ck-scenario, ck-security, coding-level, context-engineering
- cook, docs, find-skills, fix, git
- gkg, journal, mcp-builder, plans-kanban, preview
- problem-solving, project-management, project-organization, repomix, research
- retro, scout, security-scan, sequential-thinking, ship
- skill-creator, team, tech-graph, test, use-mcp
- watzup, worktree, xia
- document-skills (office sub-skills: docx, pdf, pptx, xlsx)

### 4. Hook System

**Location**: `.claude/hooks/`

**Default Hooks:**

1. **scout-block.cjs** - Cross-Platform Performance Optimization
   - Blocks access to heavy directories (node_modules, .git, __pycache__, dist/, build/)
   - Pure Node.js implementation (`scout-block.cjs`) — cross-platform
   - Modular internals: `scout-block/` (pattern-matcher, path-extractor, error-formatter, broad-pattern-detector)
   - Improves AI response time and token efficiency

2. **privacy-block.cjs** - Sensitive File Access Control
3. **descriptive-name.cjs** - Naming conventions enforcement
4. **simplify-gate.cjs** - Stateless prompt-time simplification gate

**Opt-In Hooks:**

- **workflow-artifact-gate.cjs** - Validates `ck:fix`/`ck:cook` review artifacts before finalize/commit/ship-like boundaries. It supports soft warnings for finalize/commit and hard blocks for ship/push/PR/deploy when enabled.

**Generated Context Hooks Disabled by Default:**

- `session-init.cjs`
- `session-state.cjs`
- `subagent-init.cjs`
- `team-context-inject.cjs`
- `dev-rules-reminder.cjs`
- `plan-format-kanban.cjs`
- `cook-after-plan-reminder.cjs`
- `usage-context-awareness.cjs`
- `usage-quota-cache-refresh.cjs`

**Hook Features:**
- Crash Fail-Open: unexpected hook crashes exit 0 for graceful degradation
- Policy Blocks: configured gates may intentionally return exit code 2
- Performance: Optimized token consumption
- Cross-Platform: Windows (PowerShell) & Unix (Bash) via Node.js dispatcher
- Comprehensive Test Coverage: scout-block and workflow-artifact-gate validated via Node.js test suite

### 5. Workflows

**Primary Workflows** (`.claude/rules/`):
1. **primary-workflow.md**: Core development cycle
   - Code implementation
   - Testing
   - Code quality
   - Integration
   - Debugging

2. **orchestration-protocol.md**: Agent coordination patterns
   - Sequential chaining
   - Parallel execution

3. **development-rules.md**: Development standards
   - File size management (<500 lines)
   - YAGNI, KISS, DRY principles
   - Code quality guidelines
   - Pre-commit/push rules

4. **documentation-management.md**: Doc maintenance
   - Roadmap and changelog updates
   - Automatic update triggers
   - Documentation protocols

## Entry Points

### For Users
- **README.md**: Project overview and quick start
- **guide/SKILLS.md**: Comprehensive skills reference (7,073 tokens)
- **claude/rules/CLAUDE.md**: Development instructions and workflows installed by the CK CLI

### For Developers
- **package.json**: Scripts and metadata
- **.gitignore**: Version control exclusions

### For Agents
- **.claude/rules/CLAUDE.md**: Primary agent instructions
- **.claude/rules/**: Development rules and protocols
- **plans/templates/**: Implementation plan templates

## Development Principles

### YAGNI (You Aren't Gonna Need It)
Avoid over-engineering and unnecessary features

### KISS (Keep It Simple, Stupid)
Prefer simple, straightforward solutions

### DRY (Don't Repeat Yourself)
Eliminate code duplication

### File Size Management
- Keep files under 500 lines
- Split large files into focused components
- Extract utilities into separate modules

### Security First
- Try-catch error handling
- Security standards coverage
- No secrets in commits
- Confidential info protection

## Agent Communication Protocol

**Report Format**: Markdown files in `./plans/<plan-name>/reports/`
**Naming Convention**: `{date}-from-[agent]-to-[agent]-[task]-report.md`

**Communication Patterns**:
- Sequential: Task dependencies require ordered execution
- Parallel: Independent tasks run simultaneously
- Query Fan-Out: Multiple researchers explore different approaches

## Git Workflow

**Commit Message Format**: Conventional Commits
```
type(scope): description

Types:
- feat: Features (minor bump)
- fix: Bug fixes (patch bump)
- docs: Documentation (patch bump)
- refactor: Code refactoring (patch bump)
- test: Tests (patch bump)
- ci: CI changes (patch bump)
- BREAKING CHANGE: Major version bump
```

**Automated Release**:
- Every push to `main` triggers release check
- Semantic versioning (MAJOR.MINOR.PATCH)
- Automated changelog generation
- GitHub releases with generated notes

## Testing Strategy

- Comprehensive unit tests required
- High code coverage mandatory
- Error scenario testing
- Performance validation
- Tests must pass before push
- No ignoring failed tests

## Documentation Standards

**Required Docs** (`./docs/`):
- `project-overview-pdr.md` - Project overview and PDR
- `code-standards.md` - Coding standards and structure
- `codebase-summary.md` - This file
- `system-architecture.md` - Architecture documentation
- `project-roadmap.md` - Development roadmap

**Documentation Triggers**:
- Feature implementation completion
- Major milestone achievements
- Bug fixes
- Security updates
- Weekly reviews

## Dependencies Overview

### Production Dependencies
None (template project)

### Development Dependencies
None — the lean kit ships no npm dependencies. Hook tests run on the built-in
Node.js test runner (`node --test`).

## File Statistics

**Total Files**: 48 files (in repomix output)
**Total Tokens**: 38,868 tokens
**Total Characters**: 173,077 chars

**Largest Files by Token Count**:
1. `guide/SKILLS.md` - 7,073 tokens
2. `README.md` - 3,261 tokens

## Integration Capabilities

### Discord Notifications
Script: `.claude/hooks/notifications/notify.cjs` + `providers/discord.cjs`
Purpose: Send project updates to Discord channels

### Agent Skills
- **research**: Research and analysis
- **docs**: Documentation workflows
- **context-engineering**: Context assembly and reasoning

## Critical Files

### Configuration
- `package.json` - Node.js config
- `.gitignore` - Git exclusions
- `.repomixignore` - Repomix exclusions

### Documentation
- `README.md` - Main project docs
- `.claude/rules/CLAUDE.md` - Agent instructions
- `guide/SKILLS.md` - Skills reference

### Workflows
- `.claude/rules/primary-workflow.md`
- `.claude/rules/development-rules.md`
- `.claude/rules/orchestration-protocol.md`
- `.claude/rules/documentation-management.md`

## Related Projects

- **claudekit** - ClaudeKit website (`../claudekit`)
- **claudekit-marketing** - Marketing Kit (`../claudekit-marketing`)
- **claudekit-cli** - CLI setup tool (`../claudekit-cli`)
- **claudekit-docs** - Public docs (`../claudekit-docs`)

## Version History

**Current**: v2.9.0-beta.2 (released 2026-01-28)
**License**: MIT
**Author**: Duy Nguyen
**Repository**: https://github.com/claudekit/claudekit-engineer

## Unresolved Questions

None identified. All core components are well-documented and functional.
