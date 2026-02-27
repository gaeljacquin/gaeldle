# Architecture Design Advisor - Memory

## Project Summary
Gaeldle: Turborepo monorepo. NestJS API (`apps/api`, port 8080) + Next.js 16 App Router web (`apps/web`, port 3000). Package manager: `bun`. See `docs/agents/architecture.md` for topology.

## Key Packages
- `packages/api-contract`: oRPC contracts + Zod schemas + Drizzle schema. Package: `@gaeldle/api-contract`. Entry: `src/index.ts`, `src/games.ts`, `src/schema.ts`.
- `packages/constants`: `IMAGE_STYLES`, `IMAGE_PROMPT_SUFFIX`, `DEFAULT_IMAGE_GEN_STYLE`. Package: `@gaeldle/constants`.

## Auth Pattern
- `StackAuthGuard` in `apps/api/src/auth/stack-auth.guard.ts` - validates JWT from `x-stack-access-token` or `Authorization: Bearer` header.
- All mutating/privileged endpoints use `@UseGuards(StackAuthGuard)`.
- Dashboard layout at `apps/web/app/dashboard/layout.tsx` gates all routes behind `stackServerApp.getUser({ or: "redirect" })`.
- No role-based authorization exists yet — auth is binary (logged in or not). No admin role concept.

## oRPC Contract Convention
- Defined in `packages/api-contract/src/games.ts` using `oc` from `@orpc/contract`.
- Pattern: `oc.route({ method, path }).input(ZodSchema).output(ZodSchema)`.
- All procedures live in `GamesContract`, mounted at `contract.games.*`.
- Naming: flat noun within the `games` namespace (e.g., `games.list`, `games.generateImage`, `games.deleteBulk`).

## Frontend Conventions
- Pages: `apps/web/app/[route]/page.tsx` — thin wrappers, import from `views/`.
- Views: `apps/web/views/[name].tsx` — main content, client components.
- Services: `apps/web/lib/services/[resource].service.ts` — wraps `orpcClient.*` calls.
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
- Reads: Next.js route handlers at `apps/web/app/api/games/` — use plain `fetch` in service, no oRPC.
- Writes: NestJS API via oRPC — all in `GamesContract` in `packages/api-contract/src/games.ts`.
- Validation or existence checks that are read-only but belong to admin flows: route them through NestJS oRPC if they are part of a write workflow (the fixIgdbIds feature validates then mutates).

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
- Max rows constant: `REPLACE_GAME_MAX_ROWS = 20` in `packages/constants/src/index.ts`.
- The `sync` contract procedure (POST /games/sync) already handles "upsert by IGDB ID" — it creates OR updates a game. This is the correct backend target for Add Game.

## Add Game Feature (designed 2026-02-26, not yet implemented)
- Uses `games.sync` contract (already exists) — no new NestJS endpoint needed.
- Validation: needs a NEW `games.validateIgdbIdAdd` oRPC procedure (checks IGDB exists + not already in DB).
- New constant: `ADD_GAME_MAX_ROWS` in `packages/constants/src/index.ts`.
- New hook: `use-igdb-id-add-validation.ts` — single-field variant of the fix validation hook.
- New component: `igdb-id-add-row.tsx` — single-field row (no "current" ID, just the new IGDB ID).
- New view: `apps/web/views/add-game.tsx`.
- New page: `apps/web/app/dashboard/add-game/page.tsx`.
