# Backend Conventions (apps/api)

## Separation of Concerns (Critical)

All backend code must separate contracts, routers, services, config, and utils.

### Structure

### Structure

```
apps/api/src/
├── app.module.ts     # Root module
├── config/           # Environment/config
├── utils/            # Pure helpers
├── [resource]/       # NestJS modules per resource
│   ├── dto/                   # DTOs with @ApiProperty / @ApiPropertyOptional
│   ├── [resource].module.ts
│   ├── [resource].controller.ts (or router) # NestJS Controller decorated with @Controller, @ApiTags, @ApiOperation, @ApiBody
│   └── [resource].service.ts  # Business logic
├── db/
│   └── schema/       # Drizzle schema exported at @workspace/api/db
└── scripts/
    └── generate-openapi.ts    # Standalone script booting Nest context to write apps/api/openapi.json
```

### Rules

- **OpenAPI First with NestJS Decorators**: Define API endpoints using standard NestJS controllers decorated with `@Controller`, `@ApiTags`, `@ApiOperation`, `@ApiBody`, `@ApiParam`, `@ApiQuery`, and `@ApiResponse`.
- **DTO Validation & Schema Specs**: Annotate DTO properties with `@ApiProperty` or `@ApiPropertyOptional` so `@nestjs/swagger` accurately reflects property types in `openapi.json`.
- **Codegen Pipeline**: Run `pnpm codegen` (or `pnpm --filter @workspace/api generate:openapi && pnpm --filter @workspace/api-client generate`) whenever backend endpoints change. This updates `apps/api/openapi.json` and regenerates `packages/api-client/src/schema.d.ts`. Both generated files are committed to git.
- **Services**: Contain business logic and DB/external integrations. They are injected into controllers.
- **Config**: Use NestJS `ConfigService` or the typed config exports in `src/config/`.
- **Utils**: Pure and side-effect free helpers.

## Next.js API Routes (Read-Only Game Operations)

Read-only game operations are implemented as Next.js App Router route handlers, not in NestJS. These routes live in `apps/web/app/api/games/` and access the database directly via a Drizzle singleton (`apps/web/lib/db.ts`).

### Route handlers

| Route                     | Auth                       | Description                                                                                                                                                                                                                                                          |
| ------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/games`          | Public                     | Paginated game list. Params: `page`, `pageSize`, `q` (ILIKE), `sortBy` (`name`\|`firstReleaseDate`\|`igdbId`\|`createdAt`), `sortDir` (`asc`\|`desc`). When `q` is present, results are ordered by `similarity(name, q) DESC` via `pg_trgm` (ignores `sortBy`/`sortDir`).         |
| `GET /api/games/artwork`  | Public                     | All games that have at least one artwork entry.                                                                                                                                                                                                                      |
| `GET /api/games/search`   | Public                     | Trigram similarity search with optional game-mode filter. Params: `q` (min `GAME_SEARCH_MIN_CHARS` = 3 chars), `limit` (default 20, min 1), `mode` (GameModeSlug). Results ordered by `similarity(name, q) DESC`. Returns empty array when `q` is below the minimum. |
| `GET /api/games/random`   | Public                     | One random game. Params: `excludeIds` (comma-separated), `mode` (GameModeSlug).                                                                                                                                                                                      |
| `GET /api/games/[igdbId]` | Stack Auth (user required) | Single game by IGDB ID. Returns 401 if not authenticated.                                                                                                                                                                                                            |

### pg_trgm Trigram Index

A GIN trigram index (`game_name_trgm_idx`) exists on `game.name` (migration `0012_game_name_trgm_idx.sql`). This makes mid-word `ILIKE '%q%'` queries efficient for any query length, unlike the B-tree index (`game_name_idx`) which cannot use leading-wildcard patterns.

- Extension: `pg_trgm` is pre-installed on all environments (local, dev, prod/Neon). No `CREATE EXTENSION` migration is needed.
- Ordering: both `GET /api/games` (when `q` is present) and `GET /api/games/search` use `similarity(name, q) DESC` from `pg_trgm` so the most relevant matches appear first.
- Minimum query length: `GAME_SEARCH_MIN_CHARS = 3` — `pg_trgm` needs at least 3 characters to generate trigrams, so queries shorter than 3 chars return an empty result immediately without hitting the DB.
- Migration note: the index is created with plain `CREATE INDEX` (not `CONCURRENTLY`) so it can run inside a Drizzle transaction. Drizzle Kit cannot generate this migration automatically — it was written by hand and registered in `apps/api/drizzle/meta/_journal.json`.

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

- **Read routes only**: Next.js API routes handle reads. Write operations (delete, sync, generateImage, bulkGenerateImages, add game, replace game) stay in NestJS and are called via `apiClient` from `@workspace/api-client`.
- **No contract package**: Shared types are generated from NestJS OpenAPI spec via `pnpm codegen`.
- **Server-only DB access**: Import `db` from `@/lib/db` only in server-side code (route handlers, server components, server actions). Never import it in client components.

## NestJS Write Endpoints

All write and admin operations are implemented in `apps/api` controllers and typed via `@workspace/api-client`. All are guarded by `HexclaveGuard`.

| Endpoint Path                      | Method | Description                                                                                                                                                                                                                                    |
| ---------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/games/sync`                  | POST   | Sync (upsert) a single game from IGDB by `igdb_id`. Used by the Add Game feature to commit a validated game.                                                                                                                                   |
| `/api/games/:id`                   | DELETE | Delete a single game by ID.                                                                                                                                                                                                                    |
| `/api/games/bulk`                  | DELETE | Bulk delete games by ID array.                                                                                                                                                                                                                 |
| `/api/image-gen/generate-image`    | POST   | Generate an AI image for a single game.                                                                                                                                                                                                        |
| `/api/image-gen/generate-images`   | POST   | Start a bulk AI image generation job.                                                                                                                                                                                                          |
| `/api/image-gen/generate-images/:imageGenId/status` | GET | Poll the status of an in-progress bulk image job.                                                                                                                                                                                        |
| `/api/games/add/validate-one`      | POST   | Validate a single IGDB ID before adding: checks IGDB existence and DB duplicate. Returns `{ igdbId, existsOnIgdb, alreadyInDb, gameName, canAdd }`.                                                                                            |
| `validateReplaceGame` | POST   | `/games/replace-game/validate-one` | Validate a current/replacement IGDB ID pair before replacing: checks both DB and IGDB. Returns `{ current, replacement, currentExistsInDb, currentGameName, replacementExistsOnIgdb, replacementAlreadyInDb, replacementGameName, canApply }`. |
| `replaceGames`        | POST   | `/games/replace-games`             | Replace up to 20 games by swapping their IGDB IDs. Input: array of `{ current, replacement }` pairs. Output: `{ success, results[] }` where each result has `status: 'updated'                                                                 | 'skipped' | 'error'`. |

## IgdbService

`apps/api/src/games/igdb.service.ts` — NestJS injectable service that communicates with the IGDB API (via Twitch OAuth2 credentials).

- `getGameById(igdbId: number): Promise<IgdbGame | null>` — fetch a single game by IGDB ID.
- `getGamesByIds(igdbIds: number[]): Promise<IgdbGame[]>` — batch-fetch multiple games by IGDB ID.
- Token management is internal: the service caches the Twitch access token and refreshes it when it expires. Requires `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` in the API config.

## Shared Constants (`@workspace/constants`)

Constants previously duplicated between `apps/api/src/lib/constants.ts` and `apps/web/lib/constants.ts` were consolidated into `packages/constants/src/index.ts`. Relevant additions:

| Constant                 | Value                     | Purpose                                                                                                                         |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `TEST_DIR`               | `'test-dir'`              | Directory used in test uploads.                                                                                                 |
| `IMAGE_GEN_DIR`          | `'res'`                   | Directory for AI-generated images in R2.                                                                                        |
| `REPLACE_GAME_MAX_ROWS`  | `20`                      | Maximum number of current/replacement pairs in a single Replace Game submission.                                                |
| `ADD_GAME_MAX_ROWS`      | `20`                      | Maximum number of games that can be added in a single Add Game submission.                                                      |
| `PLACEHOLDER_IMAGE`      | `'placeholder.jpg'`       | Filename of the placeholder image.                                                                                              |
| `PLACEHOLDER_IMAGE_R2`   | `(r2PublicUrl) => string` | Builds the full R2 URL for the placeholder image.                                                                               |
| `FILE_SIZE_LIMIT`        | `'10mb'`                  | Body size limit for the NestJS API.                                                                                             |
| `DISCOVER_GAMES_MAX`     | `50`                      | Maximum number of games returnable by the Discover Games endpoint.                                                              |
| `DISCOVER_GAMES_DEFAULT` | `10`                      | Default count for the Discover Games endpoint.                                                                                  |
| `GAME_SEARCH_MIN_CHARS`  | `3`                       | Minimum query length for `GET /api/games/search` and the `useGameSearch` hook. Matches `pg_trgm`'s minimum trigram requirement. |
