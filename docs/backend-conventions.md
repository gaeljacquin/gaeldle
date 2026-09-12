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
│   ├── database.module.ts  # NestJS Database module
│   └── database.service.ts # NestJS Database service (imports schema from @workspace/db)
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

| Route                                    | Auth                       | Description                                                                                                                                                                                                                                                          |
| ---------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/games`                         | Public                     | Paginated game list. Params: `page`, `pageSize`, `q` (ILIKE), `filter` (store or wishlist flag), `sortBy` (`name`\|`firstReleaseDate`\|`igdbId`\|`createdAt`), `sortDir` (`asc`\|`desc`). When `q` is present, results are ordered by `similarity(name, q) DESC` via `pg_trgm` (ignores `sortBy`/`sortDir`). |
| `GET /api/games/artwork`                 | Public                     | All games that have at least one artwork entry.                                                                                                                                                                                                                      |
| `GET /api/games/search`                  | Public                     | Trigram similarity search with optional game-mode filter. Params: `q` (min `GAME_SEARCH_MIN_CHARS` = 3 chars), `limit` (default 20, min 1), `mode` (GameModeSlug). Results ordered by `similarity(name, q) DESC`. Returns empty array when `q` is below the minimum. |
| `GET /api/games/random`                  | Public                     | One random game. Filters for `hidden = false` and selects `gameModeGameObject`. Params: `excludeIds` (comma-separated), `mode` (GameModeSlug).                                                                                                                     |
| `GET /api/private/games/[igdbId]`        | Stack Auth / User          | Single game by IGDB ID. Validates positive 32-bit integer (400 if invalid), returns 404 if not found, 200 with `{ success: true, data: Game }`.                                                                                                                      |
| `GET /api/private/libraries/[platform]`  | Stack Auth / User          | Paginated library games for platform (`amazon`, `epic`, `gog`, `nintendo`, `steam`, `xbox`). Supports `page`, `pageSize`, `q`, `igdbId`, `sortBy`, `sortDir`. Nintendo and Steam support `filter=owned\|demos\|all`.                                            |
| `GET /api/private/wishlists/[platform]`  | Stack Auth / User          | Paginated wishlist games for platform (`epic`, `humble-bundle`, `nintendo`, `steam`, `xbox`). Supports `page`, `pageSize`, `q`, `igdbId`, `sortBy`, `sortDir`.                                                                                                      |

### pg_trgm Trigram Index

A GIN trigram index (`game_name_trgm_idx`) exists on `game.name` (migration `0012_game_name_trgm_idx.sql`). This makes mid-word `ILIKE '%q%'` queries efficient for any query length, unlike the B-tree index (`game_name_idx`) which cannot use leading-wildcard patterns.

- Extension: `pg_trgm` is pre-installed on all environments (local, dev, prod/Neon). No `CREATE EXTENSION` migration is needed.
- Ordering: both `GET /api/games` (when `q` is present) and `GET /api/games/search` use `similarity(name, q) DESC` from `pg_trgm` so the most relevant matches appear first.
- Minimum query length: `GAME_SEARCH_MIN_CHARS = 3` — `pg_trgm` needs at least 3 characters to generate trigrams, so queries shorter than 3 chars return an empty result immediately without hitting the DB.
- Migration note: the index is created with plain `CREATE INDEX` (not `CONCURRENTLY`) so it can run inside a Drizzle transaction. Drizzle Kit cannot generate this migration automatically — it was written by hand and registered in `packages/db/drizzle/meta/_journal.json`.

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

## NestJS Write & Feature Endpoints

All write, admin, and AI generation operations are implemented in `apps/api` controllers and typed via `@workspace/api-client`. All are guarded by `HexclaveGuard`.

| Endpoint Path                                      | Method | Description                                                                                                                                                                                                                                    |
| -------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/games/sync`                                  | POST   | Sync (upsert) a single game from IGDB by `igdb_id`. Used by the Add Game feature to commit a validated game.                                                                                                                                   |
| `/api/games/:id`                                   | DELETE | Delete a single game by ID.                                                                                                                                                                                                                    |
| `/api/games/:id`                                   | PATCH  | Update game details with `GameUpdateInputDto`.                                                                                                                                                                                                 |
| `/api/games/bulk`                                  | DELETE | Bulk delete games by ID array.                                                                                                                                                                                                                 |
| `/api/image-gen/generate-image`                    | POST   | Generate an AI image for a single game. If an image previously existed in that art style, it is deleted from Cloudflare R2 upon replacement. Updates `imageGen` JSON array.                                                                     |
| `/api/image-gen/delete-image`                      | POST   | Delete a generated AI image for a game by `igdbId` and `artStyle`. Removes image from Cloudflare R2 bucket and deletes entry from `imageGen` JSON array in the database.                                                                     |
| `/api/image-gen/generate-images`                   | POST   | Start a bulk AI image generation job.                                                                                                                                                                                                          |
| `/api/image-gen/generate-images/:imageGenId/status` | GET    | Poll the status of an in-progress bulk image job.                                                                                                                                                                                              |
| `/api/libraries/:platform`                         | GET    | Get all games for a library platform (`steam`, `amazon`, `gog`, `epic`, `xbox`, `nintendo`).                                                                                                                                                   |
| `/api/wishlists/:platform`                         | GET    | Get all games for a wishlist platform (`steam`, `epic`, `nintendo`, `humble-bundle`, `xbox`).                                                                                                                                                  |
| `/api/games/add/validate-one`                      | POST   | Validate a single IGDB ID before adding: checks IGDB existence and DB duplicate. Returns `{ igdbId, existsOnIgdb, alreadyInDb, gameName, canAdd }`.                                                                                            |
| `/api/games/replace-game/validate-one`              | POST   | Validate a current/replacement IGDB ID pair before replacing: checks both DB and IGDB. Returns `{ current, replacement, currentExistsInDb, currentGameName, replacementExistsOnIgdb, replacementAlreadyInDb, replacementGameName, canApply }`. |
| `/api/games/replace-games`                         | POST   | Replace up to 20 games by swapping their IGDB IDs. Input: array of `{ current, replacement }` pairs. Output: `{ success, results[] }` where each result has `status: 'updated' \| 'skipped' \| 'error'`.                                    |
| `/api/clue/generate-clue`                          | POST   | Generate an AI textual clue for a game by `igdbId` using the specified AI provider (`cloudflare` or `bedrock`).                                                                                                                               |
| `/api/clue/history`                                | GET    | Get clue generation history for a game by `igdbId`.                                                                                                                                                                                            |
| `/api/clue/restore`                                | POST   | Restore a previously generated clue from history by `historyId`.                                                                                                                                                                               |

## Database Package (`@workspace/db`)

Database schemas, migrations, and database administration scripts live in `packages/db`:

- **Schema definition**: `packages/db/src/schema/game.ts` defines the `games` table with columns for store libraries (`steam`, `epic`, `gog`, `nintendo`, `amazon`, `microsoft`, `xbox`), store demos (`steamDemo`, `epicDemo`, `nintendoDemo`), wishlists (`steamWishlist`, `epicWishlist`, `nintendoWishlist`, `xboxWishlist`, `humbleBundleWishlist`), and visibility (`hidden`).
- **Partial indexes**: Created on `id` where each respective store flag is `true`, and where `hidden = false`.
- **Field selection objects**:
  - `gameObject`: Selects all game columns including store and wishlist flags.
  - `gameModeGameObject`: Selects standard game metadata while excluding all store and wishlist boolean flags.
- **Exported types**:
  - `Game`: Full game record (`typeof allGames.$inferSelect`).
  - `GameModeGame`: Omitted type stripping store and wishlist flags, used for game mode sessions.
  - `GameInsert`: Insert model for games.

## AI & External Services

### AiService (`apps/api/src/lib/ai.service.ts`)
Injectable service providing multi-provider AI text and image generation:
- **Image Generation**: Cloudflare AI (`@cf/stabilityai/stable-diffusion-xl-base-1.0`).
- **Text Generation (Cloudflare)**: Cloudflare Workers AI for JSON and prompt completions (`@cf/meta/llama-3.1-8b-instruct`).
- **Text Generation (AWS Bedrock)**: AWS Bedrock runtime (`@aws-sdk/client-bedrock-runtime`) using `ConverseCommand` with model `us.amazon.nova-2-lite-v1:0` for high-quality game clues.

### IgdbService (`apps/api/src/lib/igdb.service.ts`)
Injectable service that communicates with the IGDB API (via Twitch OAuth2 credentials):
- `getGameById(igdbId: number): Promise<IgdbGame | null>` — fetch a single game by IGDB ID with covers, artworks, franchises, collections, platforms, genres, themes, game engines, and involved companies.
- `getGamesByIds(igdbIds: number[]): Promise<IgdbGame[]>` — batch-fetch multiple games by IGDB IDs.
- Token management is internal: caches and auto-refreshes Twitch OAuth tokens.

## Shared Package (`@workspace/shared`)

Shared constants and utility functions are consolidated in `packages/shared/src/index.ts`:

### Constants

| Constant                 | Value                     | Purpose                                                                                                                         |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `DEFAULT_PROVIDER`       | `'cloudflare'`            | Default AI provider slug.                                                                                                       |
| `IMAGE_GEN_MIN`          | `1`                       | Minimum count for bulk image generation.                                                                                        |
| `IMAGE_GEN_MAX`          | `50`                      | Maximum count for bulk image generation.                                                                                        |
| `FILE_SIZE_LIMIT`        | `'10mb'`                  | Body size limit for the NestJS API.                                                                                             |
| `SAMPLE_DIR`             | `'sample-dir'`            | Sample directory identifier.                                                                                                    |
| `IMAGE_GEN_DIR`          | `'res'`                   | Directory for AI-generated images in R2.                                                                                        |
| `ADD_GAME_MAX_ROWS`      | `20`                      | Maximum number of games in a single Add Game submission.                                                                        |
| `PLACEHOLDER_IMAGE`      | `'placeholder.jpg'`       | Filename of the placeholder image.                                                                                              |
| `DISCOVER_GAMES_MAX`     | `50`                      | Maximum number of games returnable by Discover Games.                                                                           |
| `DISCOVER_GAMES_DEFAULT` | `10`                      | Default count for Discover Games.                                                                                               |
| `GAME_SEARCH_MIN_CHARS`  | `3`                       | Minimum query length for `GET /api/games/search` and `useGameSearch`. Matches `pg_trgm`'s trigram requirement.                  |
| `TIMELINE_GAMES_COUNT`   | `10`                      | Number of games in a Timeline game session.                                                                                     |
| `CLUE_SYSTEM_PROMPT`     | `string`                  | System prompt for generating single mystery game clues without leaking the game title.                                          |

### Helper Functions

- `timelineFormatDate(timestamp: number | null): string` — Formats unix timestamp into `YYYY-MM-DD` (or `????-??-??` if null).
- `extractReleaseYear(firstReleaseDate: number | null): string | null` — Extracts release year string from timestamp.
- `extractArray(data: unknown): string[]` — Extracts string array from string arrays or object arrays with `.name`.
- `extractPublisher(involvedCompanies: unknown): string | null` — Extracts publisher company name from involved companies array.
