# Agent Guide

This repository is a NestJS backend API for games data and Stack Auth-protected endpoints, with Postgres via Drizzle ORM.

- Package manager: `bun` (use `bun run`, not `pnpm` or `npm`).
- Core checks used across tasks: `bun run type-check`, `bun run lint`, `bun run test`.
- Build command: `bun run build`.
- Do not commit secrets from `.env` or credentials copied from local environment files.

Use progressive disclosure for task-specific rules:

- [Quality checks and commands](docs/agents/quality-checks.md)
- [TypeScript and lint conventions](docs/agents/typescript-conventions.md)
- [Testing patterns](docs/agents/testing-patterns.md)
- [Database and migrations (Drizzle)](docs/agents/database-migrations.md)
- [Runtime configuration and env vars](docs/agents/runtime-config.md)
- [Coder workspace notes](docs/agents/coder-workspace.md)
