# AGENTS.md

Gaeldle is an Nx monorepo with a Next.js web app and an Elysia (Bun) API.

## Essentials

- Package managers: root uses `pnpm`; `apps/api` uses `bun`; `apps/web` uses `pnpm`.
- Non-standard build/typecheck commands:
  - `nx run-many -t build`
  - `nx run-many -t test`
  - `nx run web:type-check`
  - `nx run web:lint`
  - `cd apps/api && bun run type-check`

## More guidance

- [Architecture overview](docs/agents/architecture.md)
- [Dev commands](docs/agents/commands.md)
- [Frontend conventions (separation of concerns)](docs/agents/frontend-conventions.md)
- [Backend conventions (routes/services/config)](docs/agents/backend-conventions.md)
- [Docker workflow](docs/agents/docker.md)
- [Common workflows](docs/agents/workflows.md)
