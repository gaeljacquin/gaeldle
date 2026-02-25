# Backend Conventions (apps/api)

## Separation of Concerns (Critical)

All backend code must separate contracts, routers, services, config, and utils.

### Structure

```
packages/api-contract/src/
├── index.ts          # Main contract entry point
├── schema.ts         # Zod schemas and DB types
└── [resource].ts     # Resource-specific oRPC routes

apps/api/src/
├── app.module.ts     # Root module with oRPC setup
├── config/           # Environment/config
├── utils/            # Pure helpers
├── [resource]/       # NestJS modules per resource
│   ├── [resource].module.ts
│   ├── [resource].router.ts   # oRPC implementation
│   └── [resource].service.ts  # Business logic
└── db/               # Database schema/connection
```

### Rules

- **Contract First**: Define API endpoints in `packages/api-contract` using oRPC and Zod before implementation.
- **Routers**: Use `@Implement(contract.path)` and `implement(contract.path).handler()` in NestJS controllers (routers). Routers should only handle input/output mapping and call services.
- **Services**: Contain business logic and DB/external integrations. They are injected into routers.
- **Validation**: Use Zod in the contract for automated input/output validation.
- **Config**: Use NestJS `ConfigService` or the typed config exports in `src/config/`.
- **Utils**: Pure and side-effect free helpers.

## Next.js API Routes (Read-Only Game Operations)

Read-only game operations are implemented as Next.js App Router route handlers, not in NestJS. These routes live in `apps/web/app/api/games/` and access the database directly via a Drizzle singleton (`apps/web/lib/db.ts`).

### Route handlers

| Route | Auth | Description |
|---|---|---|
| `GET /api/games` | Public | Paginated game list. Params: `page`, `pageSize`, `q` (ILIKE), `sortBy` (`name`\|`firstReleaseDate`\|`igdbId`), `sortDir` (`asc`\|`desc`). |
| `GET /api/games/artwork` | Public | All games that have at least one artwork entry. |
| `GET /api/games/search` | Public | ILIKE search with optional game-mode filter. Params: `q` (min 2 chars), `limit`, `mode` (GameModeSlug). |
| `GET /api/games/random` | Public | One random game. Params: `excludeIds` (comma-separated), `mode` (GameModeSlug). |
| `GET /api/games/[igdbId]` | Stack Auth (user required) | Single game by IGDB ID. Returns 401 if not authenticated. |

### DB client

`apps/web/lib/db.ts` exports a singleton `db` (Drizzle over `node-postgres` pool). It reads `DATABASE_URL` from the environment. Import it in server-only files (route handlers, server actions).

```ts
import { db } from '@/lib/db';
```

### Response shape

All route handlers return `NextResponse.json` with a consistent envelope:

```ts
{ success: true, data: ... }           // success
{ success: true, data: ..., meta: { page, pageSize, total } }  // paginated
{ success: false, error: '...' }       // failure (paired with an HTTP error status)
```

### Rules

- **Read routes only**: Next.js API routes handle reads. Write operations (delete, sync, generateImage, bulkGenerateImages) stay in NestJS and are called via oRPC.
- **No oRPC contract needed**: These routes are not part of the oRPC contract in `packages/api-contract`. They are plain HTTP endpoints consumed by `fetch`.
- **Server-only DB access**: Import `db` from `@/lib/db` only in server-side code (route handlers, server components, server actions). Never import it in client components.
