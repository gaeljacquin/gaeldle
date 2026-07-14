# AGENTS.md

Gaeldle is a Turborepo monorepo with a Next.js web app and a NestJS API.

## Essentials

- Package manager: `nr` (unified for root and apps).
- Commands:
  - `nr build` (or `turbo build`)
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

