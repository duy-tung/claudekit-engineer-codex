# Codebase Summary

**Last Updated**: 2026-02-25
**Version**: 3.0.0-beta.1 (Plugin namespace migration)
**Repository**: [claudekit/claudekit-engineer](https://github.com/claudekit/claudekit-engineer)

## Overview

ClaudeKit Engineer is a comprehensive boilerplate template for building professional software projects with CLI Coding Agents (Claude Code and Open Code). It provides a complete development environment with AI-powered agent orchestration, automated workflows, and intelligent project management.

**Plugin Migration (v3.0.0-beta.1)**: Skills are now available through the CC Plugin system via `/ck:cook`, `/ck:debug`, etc. Fallback `.claude/skills/` directory preserved for backward compatibility. Plugin namespace at `plugins/ck/` is primary distribution location.

## Project Structure

```
claudekit-engineer/
├── .agents/              # Agent context storage (optional, for agent state)
├── .claude/              # Claude Code configuration (fallback)
│   ├── agent-memory/     # Agent state and memory storage
│   ├── agents/           # Specialized agent definitions (14 agents)
│   ├── command-archive/  # Archived legacy command definitions
│   ├── hooks/            # Claude hooks (session, subagent, privacy, etc.)
│   ├── output-styles/    # Output formatting templates
│   ├── rules/            # Development rules and workflows
│   ├── schemas/          # JSON schema definitions
│   ├── scripts/          # Utility scripts and Python tools
│   ├── skills/           # Specialized skills library (fallback)
│   ├── .ck.json          # ClaudeKit configuration
│   ├── .ckignore         # ClaudeKit ignore patterns
│   ├── .env.example      # Environment variables template
│   ├── .gitignore        # Git exclusions for .claude
│   ├── .mcp.json.example # MCP server configuration template
│   ├── metadata.json     # Migration metadata with deletions
│   ├── settings.json     # Claude settings
│   ├── statusline.cjs    # Status line script (Node.js)
│   ├── statusline.ps1    # Status line script (PowerShell)
│   └── statusline.sh     # Status line script (Bash)
├── .claude-archived/     # Archived Claude configuration (backup)
├── .claude-plugin/       # Plugin marketplace configuration
│   └── marketplace.json  # Plugin registry pointing to ./plugins/ck
├── .github/              # GitHub Actions workflows
│   └── workflows/        # CI/CD automation
├── .husky/               # Git hooks configuration
├── plugins/              # CC Plugin system namespace
│   └── ck/               # ClaudeKit plugin
│       ├── .claude-plugin/
│       │   └── plugin.json      # Plugin metadata
│       └── skills/              # Plugin namespace skills (primary)
├── docs/                 # Project documentation
│   └── research/         # Research reports directory
├── guide/                # User guides and references
├── plans/                # Implementation plans and reports
│   ├── reports/          # Agent-to-agent communication
│   └── templates/        # Plan templates
├── scripts/              # Utility scripts (sync, deploy, etc.)
├── tests/                # Test files and test utilities
├── .commitlintrc.json    # Commit lint configuration
├── .coverage             # Code coverage report data
├── .env.example          # Environment variables template
├── .gitignore            # Git exclusions
├── .releaserc.cjs        # Semantic release configuration (main)
├── .releaserc.beta-config.json    # Beta release configuration
├── .releaserc.production.json      # Production release configuration
├── .repomixignore        # Repomix exclusions
├── AGENTS.md             # Agent list and documentation
├── CHANGELOG.md          # Version history and changes
├── CLAUDE.md             # Project-specific Claude instructions
├── GEMINI.md             # Gemini AI integration guide
├── LICENSE               # MIT license
├── package.json          # Node.js dependencies and scripts
├── package-lock.json     # Locked dependency versions
├── portable-manifest.json # Migration manifest for portable operations
├── README.md             # Project overview and quick start
└── TEST-MANIFEST.md      # Test manifest and testing guide
```

## Core Technologies

### Runtime & Dependencies
- **Node.js**: >=18.0.0
- **Package Manager**: npm
- **License**: MIT

### Development Tools
- **Semantic Release**: Automated versioning and changelog
- **Commitlint**: Conventional commit enforcement
- **Husky**: Git hooks automation
- **Repomix**: Codebase compaction for AI consumption

### CI/CD
- **GitHub Actions**: Automated release workflow
- **Semantic Versioning**: Automated version management
- **Conventional Commits**: Structured commit messages

## Key Components

### 1. Agent Orchestration System (14 Agents)

**Claude Code Agents** (`.claude/agents/`):
- `planner.md` - Technical planning and architecture (Opus model)
- `researcher.md` - Research and analysis
- `fullstack-developer.md` - Full-stack implementation
- `code-reviewer.md` - Code quality assessment
- `tester.md` - Testing and validation
- `debugger.md` - Issue analysis and debugging
- `docs-manager.md` - Documentation management (Gemini model)
- `git-manager.md` - Version control operations
- `journal-writer.md` - Development journaling
- `brainstormer.md` - Solution ideation
- `project-manager.md` - Project tracking
- `ui-ux-designer.md` - UI/UX design
- `mcp-manager.md` - MCP server management
- `code-simplifier.md` - Code optimization and simplification

### 2. Slash Commands System (Skill-Backed)

**Core Development Commands**:
- `/plan` - Research and planning
- `/cook` - Feature implementation
- `/test` - Test execution
- `/ask` - Technical consultation
- `/bootstrap` - Project initialization
- `/brainstorm` - Solution ideation
- `/debug` - Issue debugging
- `/fix` - Bug fixes

**Skill Directories** (`.claude/skills/`):
- `bootstrap/` - Project initialization workflows
- `docs/` - Documentation workflows
- `plan/` - Planning variants
- `code-review/` - Code review workflows
- `test/` - Testing workflows

### 3. Skills Library (38 Skills)

**Phase 1 Organized Groups** (Progressive Disclosure):
- **DevOps** (`devops/`) - Cloudflare (5 skills), Docker, Google Cloud Platform
  - 11 references, 2 Python utilities, 45 tests
- **Databases** (`databases/`) - MongoDB, PostgreSQL
  - 8 references, 3 Python utilities
- **Web Frameworks** (`web-frameworks/`) - Next.js, Turborepo, RemixIcon
  - 7 references, 2 Python utilities
- **UI Styling** (`ui-styling/`) - shadcn/ui, Tailwind CSS, canvas-design
  - 7 references, 2 Python utilities

**Current Skills** (47+ Total):
- ai-artist, ai-multimodal, agent-browser, backend-development, better-auth
- brainstorm, chrome-devtools, code-review, common, context-engineering
- cook, copywriting, databases, debug, devops
- docs-seeker, document-skills, find-skills, frontend-design, frontend-development
- git, gkg, google-adk-python, markdown-novel-viewer, mcp-builder
- mcp-management, media-processing, mermaidjs-v11, mobile-development, payment-integration
- plan, plans-kanban, problem-solving, react-best-practices, remotion
- repomix, research, scout, sequential-thinking, shader
- shopify, skill-creator, template-skill, threejs, ui-styling
- ui-ux-pro-max, web-design-guidelines, web-frameworks, web-testing

### 4. Hook System (8 Core Hooks)

**Location**: `.claude/hooks/`

**Core Hooks:**

1. **session-init.cjs** - Session Initialization
   - Detects project type (monorepo/library)
   - Identifies package manager (pnpm/npm/yarn)
   - Detects framework (Next/React/etc)
   - Writes 25+ environment variables for context cascade

2. **dev-rules-reminder.cjs** - Development Context Injection
   - Injects dev rules & context on every prompt
   - Smart deduplication prevents redundancy
   - Provides branch-matched workflow suggestions
   - Optimized for token efficiency

3. **subagent-init.cjs** - Subagent Context Injection
   - Injects compact context (~200 tokens) when spawning subagents
   - Minimizes token overhead during delegation
   - Enables efficient agent-to-agent communication

4. **scout-block.cjs** - Cross-Platform Performance Optimization
   - Blocks access to heavy directories (node_modules, .git, __pycache__, dist/, build/)
   - Node.js dispatcher with platform-specific implementations
   - Unix (Bash): scout-block.sh
   - Windows (PowerShell): scout-block.ps1
   - Automatic platform detection via `process.platform`
   - Improves AI response time and token efficiency

5. **privacy-block.cjs** - Sensitive File Access Control
6. **descriptive-name.cjs** - Naming conventions enforcement
7. **post-edit-simplify-reminder.cjs** - Post-edit optimization hints
8. **usage-context-awareness.cjs** - Context-aware usage patterns

**Hook Features:**
- Fail-Safe: All hooks exit 0 (non-blocking) - graceful degradation
- Performance: Optimized token consumption
- Cross-Platform: Windows (PowerShell) & Unix (Bash) via Node.js dispatcher
- Comprehensive Test Coverage: test-scout-block.sh (11 tests), test-scout-block.ps1 (7 tests)

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
- **CLAUDE.md**: Development instructions and workflows

### For Developers
- **package.json**: Dependencies and scripts
- **.releaserc.json**: Semantic release configuration
- **.commitlintrc.json**: Commit message linting rules
- **.gitignore**: Version control exclusions

### For Agents
- **CLAUDE.md**: Primary agent instructions
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
- `codebase-summary.md` - This file (project structure reference)
- `system-architecture.md` - Architecture documentation
- `project-roadmap.md` - Development roadmap
- `development-roadmap.md` - Detailed development phases and progress
- `project-changelog.md` - Detailed changelog
- `statusline-windows-support.md` - Windows statusline setup guide
- `statusline-architecture.md` - Technical statusline implementation
- `design-guidelines.md` - UI/UX design guidelines

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
- **@commitlint/cli**: ^18.4.3
- **@commitlint/config-conventional**: ^18.4.3
- **@semantic-release/changelog**: ^6.0.3
- **@semantic-release/commit-analyzer**: ^11.1.0
- **@semantic-release/git**: ^10.0.1
- **@semantic-release/github**: ^9.2.6
- **@semantic-release/npm**: ^11.0.2
- **@semantic-release/release-notes-generator**: ^12.1.0
- **conventional-changelog-conventionalcommits**: ^7.0.2
- **husky**: ^8.0.3
- **semantic-release**: ^22.0.12

## File Statistics

**Total Files**: 48 files (in repomix output)
**Total Tokens**: 38,868 tokens
**Total Characters**: 173,077 chars

**Top 5 Files by Token Count**:
1. `guide/SKILLS.md` - 7,073 tokens (18.2%)
2. `CHANGELOG.md` - 4,836 tokens (12.4%)
3. `README.md` - 3,261 tokens (8.4%)

## Integration Capabilities

### Discord Notifications
Script: `.claude/hooks/send-discord.sh`
Purpose: Send project updates to Discord channels

### GitHub Actions
Workflow: `.github/workflows/release.yml`
Features: Automated releases, changelog generation

### Agent Skills
- **brain**: Advanced reasoning
- **docs-seeker**: Documentation reading
- **ai-multimodal**: Visual understanding
- **ai-multimodal & imagemagick skills**: Content generation and processing

## Critical Files

### Configuration
- `package.json` - Node.js config and scripts
- `package-lock.json` - Locked dependency versions
- `.commitlintrc.json` - Conventional commit linting rules
- `.releaserc.cjs` - Semantic release configuration (main)
- `.releaserc.beta-config.json` - Beta release configuration
- `.releaserc.production.json` - Production release configuration
- `.gitignore` - Git exclusions
- `.repomixignore` - Repomix exclusions
- `.coverage` - Code coverage report data
- `.env.example` - Environment variables template

### Documentation
- `README.md` - Main project overview
- `CLAUDE.md` - Project-specific Claude instructions
- `AGENTS.md` - Agent list and documentation
- `CHANGELOG.md` - Version history and changes
- `GEMINI.md` - Gemini AI integration guide
- `TEST-MANIFEST.md` - Testing guide and manifest
- `guide/SKILLS.md` - Skills reference
- `LICENSE` - MIT license

### Manifests & Migration
- `portable-manifest.json` - Portable operations migration manifest
- `metadata.json` - Skill migration metadata with deletions

### Workflows & Rules
- `.claude/rules/primary-workflow.md` - Core development cycle
- `.claude/rules/development-rules.md` - Development standards
- `.claude/rules/orchestration-protocol.md` - Agent coordination
- `.claude/rules/documentation-management.md` - Doc maintenance
- `.claude/rules/team-coordination-rules.md` - Team collaboration

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
