# AGENTS.md

Gaeldle is a Turborepo monorepo with a Next.js web app and a NestJS API.

## Essentials

- Authentication: Hexclave. The web app uses `@hexclave/next`, configured in `apps/web/hexclave/`; the API uses `HexclaveGuard` in `apps/api/src/auth/hexclave.guard.ts`. Authenticated handlers read `req.hexclave?.sub` for the user ID.
- Package manager: `nr` (unified for root and apps).
- Commands:
  - `nr build` (or `turbo build`)
  - `nr codegen` (or `pnpm codegen`)
  - `nr test` (or `turbo test`)
  - `nr typecheck` (or `turbo type-check`)
  - `nr lint` (or `turbo lint`)
  - `nr dev` (or `turbo dev`)

## More guidance

- [Architecture overview](docs/architecture.md)
- [Dev commands](docs/commands.md)
- [Frontend conventions (separation of concerns)](docs/frontend-conventions.md)
- [Backend conventions (routes/services/config)](docs/backend-conventions.md)
- [Common workflows](docs/workflows.md)

## Specialized Agent Skills

The project uses Vercel's agent skills for high-quality React and design implementation. Agents should refer to these skills when working on the frontend:

- **React Best Practices**: Located in `apps/web/.agents/skills/vercel-react-best-practices`
- **Composition Patterns**: Located in `apps/web/.agents/skills/vercel-composition-patterns`
- **Web Design Guidelines**: Located in `apps/web/.agents/skills/web-design-guidelines`

## Specialist Agent Roles

The following role names are shared across agent runtimes. When a task clearly matches a role, use only the definition directory for the runtime currently handling the task; do not read or apply another runtime's agent configuration.

| Runtime | Agent definitions |
| --- | --- |
| Codex | `.codex/agents/` |
| Claude | `.claude/agents/` |
| Gemini | `.gemini/agents/` |

| Role | Purpose |
| --- | --- |
| `accessibility-auditor` | WCAG review of recently changed project-owned UI |
| `ai-image-bulk-generator` | Generation and persistence of missing game artwork |
| `architecture-design-advisor` | Architecture decisions before implementation |
| `convention-auditor` | Focused convention and quality review |
| `docs-writer` | Documentation synchronized with implementation |
| `full-stack-feature-builder` | End-to-end product feature work |
| `game-finder` | Game-catalogue gap analysis and import preparation |
| `game-mode-architect` | Game-mode design and implementation |
| `openapi-contract-auditor` | NestJS/OpenAPI/client contract audit |
| `test-writer` | Focused API and web test coverage |

Codex must read the selected brief in `.codex/agents/` before delegating the bounded task to a Codex subagent. Include the user request, exact scope, and the brief's instructions in the delegation prompt.
