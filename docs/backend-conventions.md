# Backend Conventions (apps/api)

## Architecture & Structure

The backend API is implemented in Go (`apps/api`) providing HTTP endpoints for game operations, administrative actions, image generation, and third-party integrations (IGDB, S3/R2, SQS, Cloudflare AI, Hexclave).

### Directory Structure

```
apps/api/
├── config/       # Configuration loading and environment mapping (AppConfig)
├── db/           # PostgreSQL connection pool initialization
├── handlers/     # HTTP route handlers (Games, Discover, ImageGen, Auth, Health, Sample)
├── lib/          # Shared helpers (AWS SigV4 request signing)
├── middleware/   # HTTP middlewares (Hexclave JWT Auth, CORS, Request Logging)
├── models/       # Domain data models and DTOs (Game, DiscoverCandidate, etc.)
├── services/     # Business logic and external services (IGDB, S3, SQS, AI, Hexclave, Games, Discover)
├── go.mod        # Go module definition
└── main.go       # Server entry point, dependency injection, and routing
```

### Key Principles

- **Standard Library First**: Core capabilities use standard library packages (`net/http`, `crypto`, `encoding/json`, `database/sql`).
- **Separation of Concerns**: Handlers handle HTTP requests and JSON encoding/decoding; services encapsulate business logic and database queries.
- **Authentication**: Protected write/admin endpoints are guarded with the `HexclaveAuth` middleware verifying RS256 JWTs against remote JWKS.
- **API Contracts**: OpenAPI specifications are defined in `apps/api/openapi.json` and consumed via the `@workspace/api-client` package.

## Next.js API Routes (Read-Only Game Operations)

Read-only game operations are implemented as Next.js App Router route handlers in `apps/web/app/api/games/` and access the database directly via `@workspace/db` client (`apps/web/lib/db.ts`).

### Route Handlers

| Route                     | Auth                       | Description                                                                                                                                                                                                                                                          |
| ------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/games`          | Public                     | Paginated game list. Params: `page`, `pageSize`, `q` (ILIKE), `sortBy` (`name`\|`firstReleaseDate`\|`igdbId`\|`createdAt`), `sortDir` (`asc`\|`desc`). When `q` is present, results are ordered by `similarity(name, q) DESC` via `pg_trgm` (ignores `sortBy`/`sortDir`).         |
| `GET /api/games/artwork`  | Public                     | All games that have at least one artwork entry.                                                                                                                                                                                                                      |
| `GET /api/games/search`   | Public                     | Trigram similarity search with optional game-mode filter. Params: `q` (min `GAME_SEARCH_MIN_CHARS` = 3 chars), `limit` (default 20, min 1), `mode` (GameModeSlug). Results ordered by `similarity(name, q) DESC`. Returns empty array when `q` is below the minimum. |
| `GET /api/games/random`   | Public                     | One random game. Params: `excludeIds` (comma-separated), `mode` (GameModeSlug).                                                                                                                                                                                      |
| `GET /api/games/[igdbId]` | Stack Auth (user required) | Single game by IGDB ID. Returns 401 if not authenticated.                                                                                                                                                                                                            |

## Go API Write Endpoints

All write and admin operations are implemented in `apps/api` handlers and typed via `@workspace/api-client`. All write endpoints are guarded by `HexclaveAuth`.

| Endpoint Path                      | Method | Description                                                                                                                                                                                                                                    |
| ---------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/games/sync`                  | POST   | Sync (upsert) a single game from IGDB by `igdb_id`.                                                                                                                                                                                            |
| `/api/games/:id`                   | PATCH  | Update game details by ID.                                                                                                                                                                                                                     |
| `/api/games/:id`                   | DELETE | Delete a single game by ID.                                                                                                                                                                                                                    |
| `/api/games/bulk`                  | DELETE | Bulk delete games by ID array.                                                                                                                                                                                                                 |
| `/api/games/add/validate-one`      | POST   | Validate a single IGDB ID before adding: checks IGDB existence and DB duplicate.                                                                                                                                                               |
| `/api/discover/scan`               | POST   | Discover and rank candidate games from IGDB.                                                                                                                                                                                                   |
| `/api/discover/apply`              | POST   | Apply selected candidate games into the database.                                                                                                                                                                                              |
| `/api/image-gen/generate-image`    | POST   | Generate an AI image for a single game.                                                                                                                                                                                                        |
| `/api/image-gen/generate-images`   | POST   | Start a bulk AI image generation job.                                                                                                                                                                                                          |

## Shared Constants (`@workspace/constants`)

Constants are consolidated into `packages/constants/src/index.ts`:

| Constant                 | Value                     | Purpose                                                                                                                         |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `TEST_DIR`               | `'test-dir'`              | Directory used in test uploads.                                                                                                 |
| `IMAGE_GEN_DIR`          | `'res'`                   | Directory for AI-generated images in R2.                                                                                        |
| `REPLACE_GAME_MAX_ROWS`  | `20`                      | Maximum number of current/replacement pairs in a single Replace Game submission.                                                |
| `ADD_GAME_MAX_ROWS`      | `20`                      | Maximum number of games that can be added in a single Add Game submission.                                                      |
| `PLACEHOLDER_IMAGE`      | `'placeholder.jpg'`       | Filename of the placeholder image.                                                                                              |
| `PLACEHOLDER_IMAGE_R2`   | `(r2PublicUrl) => string` | Builds the full R2 URL for the placeholder image.                                                                               |
| `FILE_SIZE_LIMIT`        | `'10mb'`                  | Body size limit for API payloads.                                                                                               |
| `DISCOVER_GAMES_MAX`     | `50`                      | Maximum number of games returnable by the Discover Games endpoint.                                                              |
| `DISCOVER_GAMES_DEFAULT` | `10`                      | Default count for the Discover Games endpoint.                                                                                  |
| `GAME_SEARCH_MIN_CHARS`  | `3`                       | Minimum query length for `GET /api/games/search` and the `useGameSearch` hook. Matches `pg_trgm`'s minimum trigram requirement. |
