# Architecture Overview

## Topology

- `apps/api`: NestJS API using oRPC (TypeScript, Bun runtime), default port 8080.
- `apps/web`: Next.js 15 App Router app (TypeScript, Tailwind v4), default port 3000.
- `packages/api-contract`: Shared oRPC contract and Zod schemas used by both API and Web.
- Monorepo: Turborepo workspace with apps under `apps/` and packages under `packages/`.

## Data & Auth

- Database: PostgreSQL 17 (default port 5432).
- oRPC: Used for end-to-end type-safe API communication.
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

- API: `GET /health`.
- API actuator: `GET /actuator/health`.
- Web dashboard: `http://localhost:3000/health`.

## Environment Variables

### API (`apps/api`)

- `PORT` or `SERVER_PORT`
- `CLIENT_PORT`
- `CORS_ALLOWED_ORIGINS`
- `DATABASE_URL`
- `NODE_ENV`

### Web (`apps/web`)

- `NEXT_PUBLIC_SERVER_URL` (client-side)
- `SERVER_URL` (server-side)
- `CLIENT_PORT`
