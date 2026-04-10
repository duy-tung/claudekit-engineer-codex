# Skill Domain Routing

When a user's task involves a specific domain, consider suggesting relevant specialized skills.

## Domain → Skill Mapping

| Domain Signals | Suggested Skills |
|----------------|-----------------|
| frontend, UI, component, CSS, React | `/ck:frontend-development`, `/ck:ui-ux-pro-max`, `/ck:frontend-design` |
| backend, API, server, endpoint, REST | `/ck:backend-development` |
| database, SQL, schema, migration, query | `/ck:databases` |
| deploy, CI/CD, Docker, infrastructure | `/ck:deploy`, `/ck:devops` |
| test, coverage, assertion, spec | `/ck:test` |
| security, auth, vulnerability, OWASP | `/ck:ck-security`, `/ck:security-scan` |
| AI, LLM, agent, prompt, model | `/ck:context-engineering`, `/ck:llms` |
| MCP, tool server, protocol | `/ck:mcp-builder`, `/ck:mcp-management` |
| design, mockup, wireframe, layout | `/ck:design`, `/ck:web-design-guidelines` |
| mobile, iOS, Android, Flutter | `/ck:mobile-development` |
| 3D, shader, WebGL, Three.js | `/ck:threejs`, `/ck:shader` |
| payment, Stripe, billing | `/ck:payment-integration` |
| Shopify, e-commerce, store | `/ck:shopify` |

## Usage Notes

- Domain skills are leaf nodes — they don't chain to other skills
- They provide specialized knowledge for their domain
- Combine with core workflow: `/ck:plan` → domain skill context → `/ck:cook`
- If a user's request touches multiple domains, mention relevant skills without overwhelming
