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

- **Read routes only**: Next.js API routes handle reads. Write operations (delete, sync, generateImage, bulkGenerateImages, add game, replace game) stay in NestJS and are called via oRPC.
- **No oRPC contract needed**: These routes are not part of the oRPC contract in `packages/api-contract`. They are plain HTTP endpoints consumed by `fetch`.
- **Server-only DB access**: Import `db` from `@/lib/db` only in server-side code (route handlers, server components, server actions). Never import it in client components.

## NestJS Write Endpoints (GamesContract)

All write and admin operations live in `packages/api-contract/src/games.ts` under `GamesContract` and are implemented in `apps/api/src/games/games.router.ts`. All are guarded by `StackAuthGuard`.

| Contract key | Method | Path | Description |
|---|---|---|---|
| `sync` | POST | `/games/sync` | Sync (upsert) a single game from IGDB by `igdb_id`. Used by the Add Game feature to commit a validated game. |
| `deleteGame` | POST | `/games/delete` | Delete a single game by IGDB ID. |
| `deleteGames` | POST | `/games/delete-many` | Bulk delete games by IGDB ID. |
| `generateImage` | POST | `/games/generate-image` | Generate an AI image for a single game. |
| `bulkGenerateImages` | POST | `/games/bulk-generate-images` | Start a bulk AI image generation job. |
| `getBulkJobStatus` | GET | `/games/bulk-job-status/:jobId` | Poll the status of an in-progress bulk image job. |
| `validateIgdbIdAdd` | POST | `/games/add/validate-one` | Validate a single IGDB ID before adding: checks IGDB existence and DB duplicate. Returns `{ igdbId, existsOnIgdb, alreadyInDb, gameName, canAdd }`. |
| `validateReplaceGame` | POST | `/games/replace-game/validate-one` | Validate a current/replacement IGDB ID pair before replacing: checks both DB and IGDB. Returns `{ current, replacement, currentExistsInDb, currentGameName, replacementExistsOnIgdb, replacementAlreadyInDb, replacementGameName, canApply }`. |
| `replaceGames` | POST | `/games/replace-games` | Replace up to 20 games by swapping their IGDB IDs. Input: array of `{ current, replacement }` pairs. Output: `{ success, results[] }` where each result has `status: 'updated' | 'skipped' | 'error'`. |

## IgdbService

`apps/api/src/games/igdb.service.ts` — NestJS injectable service that communicates with the IGDB API (via Twitch OAuth2 credentials).

- `getGameById(igdbId: number): Promise<IgdbGame | null>` — fetch a single game by IGDB ID.
- `getGamesByIds(igdbIds: number[]): Promise<IgdbGame[]>` — batch-fetch multiple games by IGDB ID.
- Token management is internal: the service caches the Twitch access token and refreshes it when it expires. Requires `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` in the API config.

## Shared Constants (`@gaeldle/constants`)

Constants previously duplicated between `apps/api/src/lib/constants.ts` and `apps/web/lib/constants.ts` were consolidated into `packages/constants/src/index.ts`. Relevant additions:

| Constant | Value | Purpose |
|---|---|---|
| `TEST_DIR` | `'test-dir'` | Directory used in test uploads. |
| `IMAGE_GEN_DIR` | `'res'` | Directory for AI-generated images in R2. |
| `REPLACE_GAME_MAX_ROWS` | `20` | Maximum number of current/replacement pairs in a single Replace Game submission. |
| `ADD_GAME_MAX_ROWS` | `20` | Maximum number of games that can be added in a single Add Game submission. |
| `PLACEHOLDER_IMAGE` | `'placeholder.jpg'` | Filename of the placeholder image. |
| `PLACEHOLDER_IMAGE_R2` | `(r2PublicUrl) => string` | Builds the full R2 URL for the placeholder image. |
| `FILE_SIZE_LIMIT` | `'10mb'` | Body size limit for the NestJS API. |
