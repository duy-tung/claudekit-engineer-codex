# Skills Catalog

Auto-generated catalog of all available skills in ClaudeKit Engineer.

**Last Updated**: 2026-06-13

**Total Skills**: 48

## Categories

- [Development Tools](#dev-tools)
- [Multimedia & Processing](#multimedia)
- [Utilities & Helpers](#utilities)

## Legend

- 📦 Has executable scripts
- 📚 Has reference documentation

## Development Tools

### 📚 `agentize`

Convert a codebase, feature, or module into an AI-agent-friendly CLI and/or MCP server. Covers npm packaging, stdio/SSE/Streamable HTTP surfaces, credential resolution, docs, tests, CI, and a companion Claude skill for users who need an existing capability exposed as a reusable agent tool.

**Location**: `.claude/skills/agentize/SKILL.md`

### `find-skills`

Helps users discover and install agent skills when they ask questions like "how do I do X", "find a skill for X", "is there a skill that can...", or express interest in extending capabilities. This skill should be used when the user is looking for functionality that might exist as an installable skill.

**Location**: `.claude/skills/find-skills/SKILL.md`

### 📚 `git`

Git operations with conventional commits. Use for staging, committing, pushing, PRs, merges. Auto-splits commits by type/scope. Security scans for secrets.

**Location**: `.claude/skills/git/SKILL.md`

### 📚 `gkg`

Semantic code analysis with GitLab Knowledge Graph. Use for go-to-definition, find-usages, impact analysis, architecture visualization. Supports Ruby, Java, Kotlin, Python, TypeScript/JavaScript.

**Location**: `.claude/skills/gkg/SKILL.md`

### `graphify`

Build queryable knowledge graphs from code, docs, papers, and images. Use for codebase understanding, architecture analysis, cross-file relationship discovery, token-efficient navigation.

**Location**: `.claude/skills/ck-graphify/SKILL.md`

### 📦 📚 `harness`

Build, audit, and improve a Claude Code harness for any repo — AGENTS.md/CLAUDE.md instructions, machine-readable feature-list state, a fail-fast verification entrypoint, scope boundaries, and session handoff. Scores a project across five harness subsystems and scaffolds the missing primitives.

**Location**: `.claude/skills/ck-harness/SKILL.md`

### 📦 `mcp-builder`

Build MCP servers for LLM-external service integration. Use for FastMCP (Python), MCP SDK (Node/TypeScript), tool design, API integration, resource providers.

**Location**: `.claude/skills/mcp-builder/SKILL.md`

### 📦 `plans-kanban`

Open the ClaudeKit plans dashboard in the CLI config UI. Use for plan kanban views, progress tracking, timeline checks, and quick navigation into plan files.

**Location**: `.claude/skills/plans-kanban/SKILL.md`

### 📦 📚 `repomix`

Pack repositories into AI-friendly files with Repomix (XML, Markdown, plain text). Use for new-project onboarding, codebase snapshots, LLM context preparation, security audits, third-party library analysis.

**Location**: `.claude/skills/repomix/SKILL.md`

### 📚 `scout`

Fast codebase scouting using parallel agents. Use for file discovery, task context gathering, quick searches across directories. Supports internal (Explore) and external (Gemini/OpenCode) agents.

**Location**: `.claude/skills/scout/SKILL.md`

### 📚 `ship`

Ship pipeline: merge main, test, review, commit, push, PR. Single command from feature branch to PR URL. Use for shipping official releases to main/master or beta releases to dev/beta branches.

**Location**: `.claude/skills/ship/SKILL.md`

### 📦 📚 `skill-creator`

Create or update Claude skills with eval-driven iteration. Use for new skills, skill scripts, references, benchmark optimization, description optimization, eval testing, extending Claude's capabilities.

**Location**: `.claude/skills/skill-creator/SKILL.md`

### 📚 `team`

Orchestrate Agent Teams for parallel multi-session collaboration. Use for research, implementation, review, and debug workflows requiring independent teammates.

**Location**: `.claude/skills/team/SKILL.md`

### 📦 📚 `tech-graph`

Generate production-quality SVG+PNG technical diagrams — architecture, data flow, flowchart, sequence, agent/memory, or concept maps — across 7 visual styles. Use when user wants "generate diagram", "draw diagram", "visualize", "architecture diagram", "flowchart", or any system/flow they want illustrated. Pairs with /ck:preview --diagram for visual self-review; this skill is the publish-grade output mode.

**Location**: `.claude/skills/tech-graph/SKILL.md`

### 📦 📚 `use-mcp`

Discover and execute MCP server tools. Two execution paths: Gemini CLI (LLM-driven, all tasks) or direct scripts (deterministic, specific tool/server). Use for MCP integrations, tool execution, capability discovery, persistent tool catalog.

**Location**: `.claude/skills/use-mcp/SKILL.md`

### 📦 `worktree`

Create, inspect, and clean isolated git worktrees. Use for feature isolation, worktree health audits, stale cleanup, and monorepo or submodule workflows.

**Location**: `.claude/skills/worktree/SKILL.md`

### 📚 `xia`

Extract, compare, port, or adapt a feature from a GitHub repository or local repo path into the current project. Use when the user wants to copy behavior from another repo, study how another codebase implements something, compare implementations, or rewrite a feature in the local stack. Triggers on: 'port from', 'copy from repo', 'like how X does it', 'clone feature from', 'adapt from', 'bring feature from', 'borrow from', 'take from repo', 'xia', 'xi a', 'xia feature'.

**Location**: `.claude/skills/xia/SKILL.md`

## Multimedia & Processing

### 📦 `docx`

Create, edit, analyze .docx Word documents. Use for document creation, tracked changes, comments, formatting preservation, text extraction, template modification.

**Location**: `.claude/skills/document-skills/docx/SKILL.md`

### 📦 `pdf`

Extract text/tables, create, merge, split PDFs. Fill PDF forms programmatically. Use for PDF processing, generation, form filling, document analysis, batch operations.

**Location**: `.claude/skills/document-skills/pdf/SKILL.md`

### 📦 `pptx`

Create, edit, analyze .pptx PowerPoint files. Use for presentations, slides, layouts, speaker notes, template modification, content extraction, slide generation.

**Location**: `.claude/skills/document-skills/pptx/SKILL.md`

### `xlsx`

Create, edit, analyze spreadsheets (.xlsx, .csv, .tsv). Use for Excel formulas, data analysis, visualization, formatting, pivot tables, charts, formula recalculation.

**Location**: `.claude/skills/document-skills/xlsx/SKILL.md`

## Utilities & Helpers

### `ask`

Answer technical and architectural questions with expert analysis. Use for design decisions, best practices evaluation, solution comparison.

**Location**: `.claude/skills/ask/SKILL.md`

### `autoresearch`

Autoresearch is the upstream meta-framework (Udit Goenka, MIT) for autonomous goal-directed iteration with safety guardrails. Locally split into 4 specialized skills. Start here to learn the pattern, then route to the right specialized skill.

**Location**: `.claude/skills/ck-autoresearch/SKILL.md`

### 📚 `bootstrap`

Bootstrap new projects with research, tech stack, design, planning, and implementation. Modes: full (default interactive), auto (explicit autonomous), fast (skip research), parallel (multi-agent).

**Location**: `.claude/skills/bootstrap/SKILL.md`

### `brainstorm`

Brainstorm solutions with trade-off analysis and brutal honesty. Use for ideation, architecture decisions, technical debates, feature exploration, feasibility assessment, design discussions.

**Location**: `.claude/skills/brainstorm/SKILL.md`

### 📚 `code-review`

Review code quality with evidence-based rigor. Supports input modes: pending changes, PR number, commit hash, and codebase scan. Focuses on bugs, regressions, maintainability, reliability, and verification gaps.

**Location**: `.claude/skills/ck-code-review/SKILL.md`

### `coding-level`

Set coding experience level for tailored output. Use for adjusting explanation depth, code complexity, and response format to user expertise.

**Location**: `.claude/skills/coding-level/SKILL.md`

### 📦 📚 `context-engineering`

Check context usage limits, monitor time remaining, optimize token consumption, debug context failures. Use when asking about context percentage, rate limits, usage warnings, context optimization, agent architectures, memory systems.

**Location**: `.claude/skills/context-engineering/SKILL.md`

### 📚 `cook`

Implement features, plans, and fixes with structured workflow. Use for feature development, plan execution, code implementation pipelines.

**Location**: `.claude/skills/cook/SKILL.md`

### 📦 📚 `debug`

Debug systematically with root cause analysis before fixes. Use for bugs, test failures, unexpected behavior, performance issues, call stack tracing, multi-layer validation, log analysis, CI/CD failures, database diagnostics, system investigation.

**Location**: `.claude/skills/ck-debug/SKILL.md`

### 📚 `docs`

Analyze codebase and manage project documentation. Use for doc initialization, updates, summaries, codebase analysis.

**Location**: `.claude/skills/docs/SKILL.md`

### 📚 `fix`

Fix bugs, errors, test failures, and CI/CD issues with intelligent routing. Use for type errors, lint issues, log errors, UI bugs, code problems.

**Location**: `.claude/skills/fix/SKILL.md`

### `journal`

Write technical journal entries analyzing recent changes. Use for session reflections, change analysis, decision documentation.

**Location**: `.claude/skills/journal/SKILL.md`

### 📚 `loop`

Autonomous iterative optimization loop — run N iterations against a mechanical metric, learn from git history, auto-keep/discard changes. Use for improving measurable metrics (coverage, performance, bundle size, etc.) through repeated experimentation.

**Location**: `.claude/skills/ck-loop/SKILL.md`

### 📚 `plan`

Plan implementations, design architectures, create technical roadmaps with detailed phases. Use for feature planning, system design, solution architecture, implementation strategy, phase documentation.

**Location**: `.claude/skills/ck-plan/SKILL.md`

### 📚 `predict`

5 expert personas debate proposed changes before implementation. Catches architectural, security, performance, and UX issues early. Use before major features or risky changes.

**Location**: `.claude/skills/ck-predict/SKILL.md`

### 📚 `preview`

View files or generate visual explanations, slides, and diagrams. Use for code walkthroughs, architecture visualization, HTML/Markdown presentations.

**Location**: `.claude/skills/preview/SKILL.md`

### 📚 `problem-solving`

Apply systematic problem-solving techniques when stuck. Use for complexity spirals, innovation blocks, recurring patterns, assumption constraints, simplification cascades, scale uncertainty.

**Location**: `.claude/skills/problem-solving/SKILL.md`

### 📚 `project-management`

Track progress, update plan statuses, manage Claude Tasks, generate reports, coordinate docs updates. Use for project oversight, status checks, plan completion, task hydration, cross-session continuity.

**Location**: `.claude/skills/project-management/SKILL.md`

### 📚 `project-organization`

Organize files, directories, and content structure in any project. Use when creating files, determining output paths, organizing existing assets, or standardizing project layout.

**Location**: `.claude/skills/project-organization/SKILL.md`

### `research`

Research technical solutions, analyze architectures, gather requirements thoroughly. Use for technology evaluation, best practices research, solution design, scalability/security/maintainability analysis.

**Location**: `.claude/skills/research/SKILL.md`

### 📚 `retro`

Generate data-driven sprint retrospectives from any git history. Use for sprint reviews, commit analysis, code-health indicators, team-velocity reporting, and quarterly engineering reviews. Works on solo or team repos.

**Location**: `.claude/skills/retro/SKILL.md`

### 📚 `scenario`

Generate comprehensive edge cases and test scenarios by decomposing features across 12 dimensions. Use for pre-implementation risk discovery, QA planning, regression design, and iterative saturation when coverage must be exhaustive.

**Location**: `.claude/skills/ck-scenario/SKILL.md`

### 📚 `security`

STRIDE + OWASP-based security audit with optional red-team persona discovery loop and auto-fix. Scans code for vulnerabilities from multiple attacker perspectives (auth attacker, supply chain, insider, infrastructure), categorizes by severity, and can iteratively fix findings using ck:autoresearch pattern.

**Location**: `.claude/skills/ck-security/SKILL.md`

### 📚 `security-scan`

Scan codebase for security vulnerabilities, hardcoded secrets, dependency issues, and OWASP patterns. Use when asked to 'security scan', 'check for secrets', 'audit security', or before major releases.

**Location**: `.claude/skills/security-scan/SKILL.md`

### 📦 📚 `sequential-thinking`

Apply step-by-step analysis for complex problems with revision capability. Use for multi-step reasoning, hypothesis verification, adaptive planning, problem decomposition, course correction.

**Location**: `.claude/skills/sequential-thinking/SKILL.md`

### 📚 `test`

Run unit, integration, e2e, and UI tests. Use for test execution, coverage analysis, build verification, visual regression, and QA reports.

**Location**: `.claude/skills/test/SKILL.md`

### 📦 `watzup`

Generate short handoff reports from Git branches, remote refs, worktrees, and unfinished plans. Use when the user asks what's in flight, wants progress/next steps, is in a fresh worktree or detached checkout, or needs end-of-session status.

**Location**: `.claude/skills/watzup/SKILL.md`
