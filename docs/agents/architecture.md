# Architecture Overview

## Topology

- `apps/api`: NestJS API using oRPC (TypeScript, Bun runtime), default port 8080.
- `apps/web`: Next.js 16 App Router app (TypeScript, Tailwind v4), default port 3000.
- `packages/api-contract`: Shared oRPC contract and Zod schemas used by both API and Web. Package name: `@gaeldle/api-contract`.
- `packages/constants`: Shared constants consumed by both API and Web. Package name: `@gaeldle/constants`.
- Monorepo: Turborepo workspace with apps under `apps/` and packages under `packages/`.

## API Responsibility Split

Game operations are split across two APIs:

| Operation type | API | Transport |
|---|---|---|
| Read (list, search, random, artwork, get by IGDB ID) | Next.js (`apps/web`) | plain `fetch` to local routes |
| Write (delete, sync, image gen, add game, replace game, validate IGDB IDs) | NestJS (`apps/api`) | oRPC client (`orpcClient`) |

Read operations are implemented as Next.js App Router API route handlers under `apps/web/app/api/games/`. They query the database directly using a Drizzle client (`apps/web/lib/db.ts`). Write operations remain in the NestJS API and are called via the oRPC contract.

## Data & Auth

- Database: PostgreSQL 17 (default port 5432).
- oRPC: Used for end-to-end type-safe communication with the NestJS API (write operations only).
- Auth: Stack Auth used in both frontend and backend.

## Ports

- API: `8080` (`PORT` or `SERVER_PORT`).
- Web: `3000` (`CLIENT_PORT`).
- DB: `5432` (`DB_PORT`).

## CORS

- Default allowed origins: `http://localhost:3000`, `http://127.0.0.1:3000`, `http://web:3000`.
- Override with `CORS_ALLOWED_ORIGINS` (comma-separated).
- Implementation lives in `apps/api/src/config/env.ts`.

## Health Checks

- NestJS API: `GET /health` — powered by `@nestjs/terminus` via `HealthModule` (`apps/api/src/health/`). Runs a live database check (`SELECT 1`) and returns a terminus-formatted response: `{ status, info, error, details }`.
- Web dashboard: `http://localhost:3000/health`. Monitors two APIs:
  - **"writes api"** — NestJS (port 8080). Pinged via `GET /` to confirm reachability.
  - **"reads api"** — Next.js (port 3000). Pinged via `GET /api/games?pageSize=1` to confirm the local DB route is up.
- Health service: `apps/web/lib/services/health.service.ts`. Uses `NEXT_PUBLIC_APP_URL` for the reads-api base URL and `serverUrl` (server-side) for the writes-api base URL.

## Code Quality & Standards

These standards apply across the entire monorepo (API, Web, and Packages).

- **Avoid Negated Conditions**: When using ternary or conditional operators, avoid negating the condition if an `else` branch (or `null` branch) is present.
  - **Bad**: `!isGameOver ? <Game /> : null`
  - **Good**: `isGameOver ? null : <Game />` or `!isGameOver && <Game />`
  - **Rationale**: Negated conditions are generally harder to read and are flagged by SonarQube (rule S1264).

## Environment Variables

### API (`apps/api`)

- `PORT` or `SERVER_PORT`
- `CLIENT_PORT`
- `CORS_ALLOWED_ORIGINS`
- `DATABASE_URL`
- `NODE_ENV`

### Web (`apps/web`)

- `SERVER_URL` (server-side, base URL for the NestJS API)
- `CLIENT_PORT`
- `DATABASE_URL` (required for the Next.js Drizzle DB client in `lib/db.ts`)
- `NEXT_PUBLIC_APP_URL` (base URL for the Next.js app, used by the health service to ping the reads API)
