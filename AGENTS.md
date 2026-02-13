# AGENTS.md

Gaeldle is a Turborepo monorepo with a Next.js web app and a NestJS API.

## Essentials

- Package manager: `bun` (unified for root and apps).
- Commands:
  - `bun run build` (or `turbo build`)
  - `bun run test` (or `turbo test`)
  - `bun run type-check` (or `turbo type-check`)
  - `bun run lint` (or `turbo lint`)
  - `bun run dev` (or `turbo dev`)

## More guidance

- [Architecture overview](docs/agents/architecture.md)
- [Dev commands](docs/agents/commands.md)
- [Frontend conventions (separation of concerns)](docs/agents/frontend-conventions.md)
- [Backend conventions (routes/services/config)](docs/agents/backend-conventions.md)
- [Common workflows](docs/agents/workflows.md)

## Specialized Agent Skills

The project uses Vercel's agent skills for high-quality React and design implementation. Agents should refer to these skills when working on the frontend:

- **React Best Practices**: Located in `apps/web/.agents/skills/vercel-react-best-practices`
- **Composition Patterns**: Located in `apps/web/.agents/skills/vercel-composition-patterns`
- **Web Design Guidelines**: Located in `apps/web/.agents/skills/web-design-guidelines`
