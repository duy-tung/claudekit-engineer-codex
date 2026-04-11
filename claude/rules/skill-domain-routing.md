# Skill Domain Routing

When a user's task involves a specific domain, use these decision trees to pick the RIGHT skill. Don't suggest multiple overlapping skills — pick ONE based on user intent.

## Frontend / UI

```
User wants to...
├── Replicate a mockup, screenshot, or video    → /ck:frontend-design
├── Build React/TS components with best practices → /ck:frontend-development
├── Style with Tailwind CSS + shadcn/ui          → /ck:ui-styling
├── Choose colors, fonts, layout, design system  → /ck:ui-ux-pro-max
├── Audit existing UI for accessibility/UX       → /ck:web-design-guidelines
├── Apply React performance patterns             → /ck:react-best-practices
├── Build with Stitch (AI design generation)     → /ck:stitch
├── Create 3D / WebGL / Three.js experience      → /ck:threejs
├── Write GLSL shaders / procedural graphics     → /ck:shader
└── Build programmatic video with Remotion       → /ck:remotion
```

## Codebase Understanding

```
User wants to...
├── Quick file search, locate specific code     → /ck:scout
├── Full codebase dump for LLM context          → /ck:repomix
├── Architecture graph, cross-file relationships → graphify skill (install separately)
└── Semantic go-to-definition, find-usages (Ruby/Java/Python/TS) → /ck:gkg
```

## Backend / API

```
User wants to...
├── Build REST/GraphQL API (NestJS, FastAPI, Django) → /ck:backend-development
├── Add authentication (OAuth, JWT, passkeys)        → /ck:better-auth
└── Integrate payments (Stripe, Polar, SePay)        → /ck:payment-integration
```

## Infrastructure / Deployment

```
User wants to...
├── Deploy to Vercel, Netlify, Railway, Fly.io   → /ck:deploy
└── Docker, Kubernetes, CI/CD pipelines, GitOps   → /ck:devops
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
├── Generate llms.txt, LLM-friendly docs         → /ck:llms
├── Build AI agents with Google ADK              → /ck:google-adk-python
└── Generate/analyze images, audio, video with AI → /ck:ai-multimodal
```

## MCP (Model Context Protocol)

```
User wants to...
├── Build a new MCP server                       → /ck:mcp-builder
├── Discover and manage existing MCP tools       → /ck:mcp-management
└── Execute MCP tools directly                   → /ck:use-mcp
```

## Testing

```
User wants to...
├── Run unit/integration/e2e tests, coverage     → /ck:test
├── Web testing (Playwright, Vitest, k6, a11y)   → /ck:web-testing
└── Browser automation, screenshots, console     → /ck:chrome-devtools
```

## Documentation

```
User wants to...
├── Update project docs (codebase-summary, PDR)  → /ck:docs
├── Search library/framework docs (context7)     → /ck:docs-seeker
├── Build docs site with Mintlify                → /ck:mintlify
└── Create diagrams (Mermaid v11 syntax)         → /ck:mermaidjs-v11
```

## Design (Non-Code)

```
User wants to...
├── Brand identity, logos, banners               → /ckm:design
├── Generate AI images (Imagen, Nano Banana)     → /ck:ai-artist
└── Create Excalidraw diagrams                   → /ck:excalidraw
```

## Frameworks

```
User wants to...
├── Next.js App Router, RSC, Turborepo           → /ck:web-frameworks
├── TanStack Start/Form/AI                       → /ck:tanstack
├── React Native, Flutter, SwiftUI               → /ck:mobile-development
└── Shopify apps, Polaris, Liquid templates       → /ck:shopify
```

## Usage Notes

- Pick ONE skill per user intent — don't list alternatives
- If user intent is ambiguous, ask which aspect they need
- Domain skills combine with core workflow: `/ck:plan` → domain skill → `/ck:cook`
- Skills not listed here are core workflow skills (plan, cook, fix, etc.) — see `skill-workflow-routing.md`
