# Agent Guide

This repository is a NestJS backend API for games data and Stack Auth-protected endpoints, with Postgres via Drizzle ORM.

- Package manager: `nr` (unified for root and apps).
- Core checks used across tasks: `nr typecheck`, `nr lint`, `nr test`.
- Build command: `nr build`.
- Do not commit secrets from `.env` or credentials copied from local environment files.

Please refer to the main project guide and conventions:
- [Root AGENTS.md](../../AGENTS.md)
- [Architecture overview](../../docs/architecture.md)
- [Backend conventions](../../docs/backend-conventions.md)
- [Development commands](../../docs/commands.md)
- [Common workflows](../../docs/workflows.md)
