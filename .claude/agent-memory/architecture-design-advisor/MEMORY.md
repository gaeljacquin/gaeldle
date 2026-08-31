# Architecture Design Advisor - Memory

## Project Summary

Gaeldle: Turborepo monorepo. NestJS API (`apps/api`, port 8080) + Next.js 16 App Router web (`apps/web`, port 3000). Package manager: `nr`. See `docs/architecture.md` for topology.

## Key Packages

- `packages/api-client`: Generated openapi-fetch client and TypeScript schema (@workspace/api-client). Entry: `src/index.ts`, `src/schema.d.ts`.
- `apps/api/src/db/schema/`: Drizzle ORM schema exported at `@workspace/api/db`.
- `packages/shared`: Shared constants (`CLUE_SYSTEM_PROMPT`, `DISCOVER_GAMES_MAX`, `DISCOVER_GAMES_DEFAULT`, `ADD_GAME_MAX_ROWS`, `GAME_SEARCH_MIN_CHARS`, `TIMELINE_GAMES_COUNT`, `IMAGE_GEN_DIR`, `IMAGE_GEN_MIN`, `IMAGE_GEN_MAX`, etc.) and utility functions (`extractArray`, `extractPublisher`, `extractReleaseYear`, `timelineFormatDate`). Package: `@workspace/shared`. Note: art styles (previously `IMAGE_STYLES`) are now stored in the `art_style` DB table (`active_art_styles` materialized view), not in this package.

## Auth Pattern

- `HexclaveGuard` / `StackAuthGuard` in `apps/api` - validates JWT / auth headers.
- All mutating/privileged endpoints use `@UseGuards(HexclaveGuard)`.
- Dashboard layout at `apps/web/app/dashboard/layout.tsx` gates all routes behind auth layout gate.

## OpenAPI & API Client Convention

- NestJS Controllers in `apps/api` decorated with `@Controller`, `@ApiTags`, `@ApiOperation`, `@ApiBody`.
- OpenAPI spec generated to `apps/api/openapi.json` via `pnpm codegen`.
- `@workspace/api-client` generated via `openapi-typescript`.
- Frontend consumes NestJS write endpoints via `apiClient` (`createApiClient`).

## Frontend Conventions

- Pages: `apps/web/app/[route]/page.tsx` — thin wrappers, import from `views/`.
- Views: `apps/web/views/[name].tsx` — main content, client components.
- Services: `apps/web/lib/services/[resource].service.ts` — wraps `apiClient.*` calls.
- State: TanStack Query (`useQuery`/`useMutation`) for server state. Zustand for complex client state.
- Notifications: `sonner` toast (`toast.success`, `toast.error`, `toast.loading` with `id` for updates).
- cn utility: must be used for conditional classNames.
- Icons: `@tabler/icons-react`.

## Dashboard Structure

- Route group: `apps/web/app/dashboard/` — protected by layout auth gate.
- Sidebar: `apps/web/components/sidebar.tsx` — collapsible, links to `/dashboard`, `/dashboard/settings`, game modes.
- Current pages: `/dashboard` (games list), `/dashboard/settings`, `/dashboard/games/[igdbId]`.
- Navbar/Footer hidden for `/dashboard` routes (via `LayoutWrapper`).

## Existing Image Gen Feature

- Single-game: `contract.games.generateImage` — POST, `@UseGuards(StackAuthGuard)`, takes `igdbId + options`, calls Cloudflare AI, uploads to R2, updates DB.
- Bulk: currently a CLI script only (`apps/api/scripts/bulk-generate-images.ts`). No API endpoint. Iterates games where `ai_image_url IS NULL`, processes serially, reports summary.
- Script params: `NUM_GAMES` (1-50), `IMAGE_STYLE`, `INCLUDE_STORYLINE`, `INCLUDE_GENRES`, `INCLUDE_THEMES` (env vars).

## Key Architectural Tension Observed

- Bulk image gen is long-running (serial Cloudflare AI calls, each takes seconds). HTTP request timeout is a real risk for any naive "run all at once" endpoint. Fire-and-forget or job/polling patterns needed for >5 games.
- No job/queue infrastructure currently exists in the API. BullMQ/Redis would be a new dependency.

## Read vs. Write Transport Split (Confirmed)

- Reads: Next.js route handlers at `apps/web/app/api/games/` — use plain `fetch` in service.
- Writes: NestJS API via OpenAPI `apiClient` from `@workspace/api-client`.
- Validation or existence checks that belong to write workflows: route through NestJS API.

## NestJS Games Module Structure

- `apps/api/src/games/games.module.ts` — registers providers: GamesService, IgdbService, S3Service, AiService, BulkImageJobStore.
- `apps/api/src/games/igdb.service.ts` — `IgdbService.getGameById(igdbId)` fetches from IGDB API. Caches token internally.
- `apps/api/src/games/games.service.ts` — `getGameByIgdbId`, `syncGameByIgdbId`, `updateGame`, `deleteGame`, `deleteGames`, `refreshAllGamesView`, bulk image gen.
- Pattern: Service methods use `this.databaseService.db` (Drizzle). View refresh called after every mutation.

## Hooks Pattern (apps/web/lib/hooks/)

- Named `use-[feature].ts`. Import service functions (not raw fetch). Use TanStack Query hooks internally.
- Example: `use-bulk-image-job.ts` polls job status and manages SSE connection.

## Sidebar Pattern (apps/web/components/sidebar.tsx)

- Uses `SidebarLink` sub-component with `href`, `icon`, `label`, `isCollapsed`, `isActive` props.
- Active state: `pathname === href` comparison.
- New admin links added inline in the `<nav>` section, above the Separator that precedes Game Modes.
- Icon import: `@tabler/icons-react`.

## View + Page Pattern

- `apps/web/app/dashboard/[page]/page.tsx`: single line, imports from `views/`.
- `apps/web/views/[name].tsx`: main client component with all state, mutations, and sub-components.
- Sub-components defined in same file or extracted to `apps/web/components/` if reusable.

## games Table Schema Key Points

- Primary key: `id` (serial). Unique key: `igdbId` (integer).
- After any mutation, call `REFRESH MATERIALIZED VIEW all_games` (already handled by `refreshAllGamesView()` in GamesService).

## Replace Game Feature Anatomy (confirmed, 2026-02-26)

- View: `apps/web/views/replace-game.tsx` — uses `RowWithValidation` wrapper component pattern: each row gets its own hook invocation to avoid Rules of Hooks violations.
- Validation hook: `apps/web/lib/hooks/use-igdb-id-fix-validation.ts` — debounces inputs (600ms), calls `validateIgdbIdFix` service, returns `IgdbIdFixValidationState` with `canApply`, `isLoading`, `isReady` etc.
- Row component: `apps/web/components/id-pair-row.tsx` — presentational, receives `validationState` as prop, renders `CurrentBadge` and `ReplacementBadge` sub-components inline.
- Results table: `apps/web/components/igdb-fix-results-table.tsx` — separate presentational component.
- Max rows constant: `REPLACE_GAME_MAX_ROWS = 20` in `packages/shared/src/index.ts`.
- The `sync` endpoint (POST /api/games/sync) handles "upsert by IGDB ID" — it creates OR updates a game. This is the correct backend target for Add Game.

## Add Game Feature (implemented as of 2026-02-26)

- Uses `POST /api/games/sync` — `syncGameByIgdbId` in GamesService.
- Validation: NestJS endpoint (POST /api/games/add/validate-one).
- Constant: `ADD_GAME_MAX_ROWS = 20` in `packages/shared/src/index.ts`.
- Hook: `use-igdb-id-add-validation.ts` — debounces 600ms, TanStack Query, returns `IgdbIdAddValidationState`.
- Component: `igdb-id-add-entry.tsx` — single-field row with inline validation badge.
- View: `apps/web/views/add-game.tsx` — `RowWithValidation` wrapper pattern (Rules of Hooks avoidance).
- Page: `apps/web/app/dashboard/add-game/page.tsx` — thin wrapper.

## IgdbService Key Facts

- `getGameById(igdbId)`: single game fetch, returns null if not found.
- `getGamesByIds(igdbIds[])`: batch fetch.
- Token cached in-memory, refreshed automatically.
- IGDB API fields: id, name, summary, storyline, first_release_date, cover, themes, genres, platforms, franchises, keywords, game_engines, game_modes, player_perspectives, release_dates, involved_companies, artworks, total_rating, total_rating_count.
- `category` and `status` NOT yet fetched — will be added for Discover Games feature.

## UI Checkbox Component

- `@workspace/ui/checkbox` — wraps Base UI `CheckboxPrimitive`. Already exists, no need to create.
- Uses `data-checked` attribute for styling.

## Sidebar Nav Order (confirmed)

- Dashboard → Bulk Image Gen → Add Game → Replace Game → Discover Games → Settings → [Separator] → Game Modes → [bottom] Home.

## actorId Extraction Pattern (confirmed 2026-03-03)

- StackAuthGuard sets `request.stackAuth = JWTPayload` on the Express request after verifying the JWT.
- JWT `sub` claim = Stack Auth user ID (actorId).
- Approach: inject `@Req()` NestJS decorator on the controller method, read `req.stackAuth?.sub`.

## Discover Games Feature (final design 2026-03-03, approved for handoff)

- Full notes in `.claude/agent-memory/architecture-design-advisor/discover-games.md`.
- New `DiscoverController` in `apps/api/src/discover/discover.router.ts`; new `DiscoverModule` in `apps/api/src/discover/`.
- IGDB query: NO exclusion list. `category=0 & status=0 & total_rating_count > 50 & themes != (42)`, sort by total_rating_count desc, limit=count param.
- Post-filter: backend checks returned igdbIds against DB; marks with `isAlreadyAdded: boolean` on each candidate.
- Two events: `discover_games.scanned` at scan time, `discover_games.applied` at apply time. Both written to `domain_event` table.
- Count: number input, default 10, range 1–50. New constants: `DISCOVER_GAMES_MAX = 50`, `DISCOVER_GAMES_DEFAULT = 10`.
- New component: `discovered-game-card.tsx` (cover image at t_cover_big, title, release year, genres, checkbox overlay).
- New service: `apps/web/lib/services/discover.service.ts`. New hook: `use-discover-games.ts`.

## Game Search Architecture (confirmed 2026-03-03)

- Game guessing UI search: `GameSearch` component (`apps/web/components/game-search.tsx`) — debounces 300ms, raw `useEffect`/`fetch` loop (NOT TanStack Query). Calls `searchGames()` in `game.service.ts`.
- Search route: Next.js route handler `GET /api/games/search` (`apps/web/app/api/games/search/route.ts`) — runs `name ILIKE '%q%'` on `game` table, ordered by `desc(games.id)` (insertion order, NOT relevance). Returns up to 100 results.
- Paginated list: `GET /api/games` (`apps/web/app/api/games/route.ts`) — supports `q`, `page`, `pageSize`, `sortBy`, `sortDir`. Also uses `ILIKE`.
- `game` table has a B-tree index on `name` (`game_name_idx`) — leading wildcard `ILIKE '%q%'` cannot use it.
- `pg_trgm` extension already installed on local, dev, and prod (Neon). No enablement migration needed.
- Stray file: `apps/api/drizzle/0001_add_name_search_tsvector.sql` — NOT in the journal, never applied. Previous partial attempt. Builder must not renumber around it or treat it as applied.
- Approved improvement: GIN trigram index on `game.name` + `similarity()` ordering + `useQuery` refactor in `GameSearch`. Migration is a single handwritten SQL file (Drizzle Kit cannot generate it — no schema.ts change needed).
- Drizzle Kit config: `apps/api/drizzle.config.ts` — schema from `apps/api/src/db/schema/index.ts` (exported at `@workspace/api/db`), output to `apps/api/drizzle/`. Next migration number is 0012.

## Clue Game Mode Architecture (implemented)

- **Backend**: `apps/api/src/clue/` — `ClueController` (`clue.router.ts`), `ClueService` (`clue.service.ts`), `ClueModule` (`clue.module.ts`).
- **Endpoints** (all `@UseGuards(HexclaveGuard)`):
  - `POST /api/clue/generate-clue` — generate an AI clue for a game by `igdbId`; accepts `provider` (`cloudflare` | `bedrock`).
  - `GET /api/clue/history` — fetch clue generation history for a game by `igdbId`.
  - `POST /api/clue/restore` — restore a previously generated clue from history by `historyId`.
- **Frontend**: hook at `apps/web/lib/hooks/use-clue-game.ts`; manages clue text, hints, attempts.
- **Hints system**: hints cost an attempt each — Release Year, Genres, Platforms, Publisher.
- **System prompt**: `CLUE_SYSTEM_PROMPT` constant in `@workspace/shared`.

## AiService Multi-Provider Architecture (apps/api/src/lib/ai.service.ts)

- **Image generation**: Cloudflare AI (`@cf/stabilityai/stable-diffusion-xl-base-1.0`) — used by Image Gen mode.
- **Text generation (Cloudflare)**: Cloudflare Workers AI — general JSON / prompt completions.
- **Text generation (AWS Bedrock)**: `@aws-sdk/client-bedrock-runtime` using `ConverseCommand` — used for Clue mode (high-quality game clues). Provider selected at call time via `provider` param.

## game Table Schema Updates

- `collections` column added (alongside `franchises`) — stores IGDB collection memberships as JSON array.
- Franchise/Series badges in guess history: `franchises` → Franchise badge (indigo), `collections` → Series badge (cyan).

