# Gaeldle Agent Memory

## Package Manager
- Use `bun` for all commands (not pnpm or npm)
- `bun run lint` — runs turbo lint across all packages
- Do NOT run `pnpm type-check` (global rule)

## Monorepo Structure
- `apps/web` — Next.js 16 App Router frontend
- `apps/api` — NestJS backend
- `packages/api-contract` — oRPC contracts (source of truth for types)

## Frontend Architecture (`apps/web`)
- `app/` — thin route pages (Server Components by default, no logic)
- `views/` — `'use client'` views with TanStack Query hooks, business logic
- `components/` — purely presentational, props-driven, no API calls
- `lib/services/` — API service functions (oRPC client OR raw fetch for non-contract endpoints)
- `lib/hooks/` — custom stateful hooks
- `lib/stores/` — Zustand stores

## Key Patterns

### Page file pattern
```tsx
import SomeView from '@/views/some-view';
export default function SomePage() { return <SomeView />; }
```

### View file pattern — `'use client'`, TanStack Query
- Sticky header with title + controls
- `container mx-auto px-4` for layout
- `isLoading && !data` for initial loading state with spinner

### Service file pattern
- For oRPC routes: `import { orpcClient } from '@/lib/orpc'`
- For non-oRPC (e.g. health endpoint): raw `fetch` with try/catch returning synthetic error shape
- API base URL: `process.env.serverUrl || 'http://localhost:8080'`

### Styling
- Theme: Teal, Figtree font (var --font-sans), JetBrains Mono (var --font-mono)
- `font-mono` class = JetBrains Mono for technical details
- `cn` utility from `@/lib/utils` for conditional classNames
- Radius: 0 (sharp corners everywhere)
- Primary color: teal hsl(171 77% 37%)
- Icons: `@tabler/icons-react` — IconHeartbeat, IconCircleCheck, IconCircleX, IconRefresh confirmed available in v3.36.1
- Always add `aria-hidden="true"` to decorative icons
- Always add `aria-live="polite"` to async-updated status regions
- `border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10` — sticky header pattern

### Button component
- Located at `@/components/ui/button`
- Uses Base UI primitive + CVA
- Size variants: `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`
- All corners are sharp (radius: 0)

### oRPC Date Serialization (CRITICAL)
- oRPC OpenAPI fetch client returns Date fields as ISO strings, NOT Date objects
- Frontend prop types must use `Date | string | null` not `Date | null`
- See patterns.md for full notes

### SSE Auth Pattern
- Use `?token=<accessToken>` query param (can't send headers via EventSource)
- See patterns.md for frontend token-fetching pattern

### Hook-per-row validation pattern (CRITICAL)
- Never call hooks in a loop (violates Rules of Hooks)
- When each list row needs its own hook, wrap each row in a small component that calls the hook once
- The wrapper component propagates state up via a stable `onValidationChange(id, state)` callback
- Parent collects per-row validation into a `Record<string, ValidationState>` via `useState`
- Use equality check inside the callback setter to avoid infinite re-render loops
- Pattern confirmed in both ReplaceGame and AddGame features

### IgdbService batch fetch
- `igdbService.getGamesByIds(ids[])` now exists — use it for batch IGDB operations
- `igdbService.getGameById(id)` — single-game lookup (used for validate endpoint)

### Tabler icons confirmed available
- `IconArrowsExchange` — confirmed in @tabler/icons-react for Replace IGDB IDs feature
- `IconCirclePlus` — confirmed in @tabler/icons-react for Add Game feature

### oRPC router handler — no-await pattern
- When the handler body is a single `return someService.asyncMethod(...)`, omit `async` on the arrow function
- Use `({ input }) => this.service.method(input.field)` (not `async ({ input }) => { return ... }`)
- This avoids the TS "async function has no await" lint error

### actorId injection in oRPC routers
- `@orpc/nest` does NOT support a context factory in `ORPCModule.forRoot({})`
- Use `@Req() req: AuthenticatedRequest` on the router method, then close over it inside `implement().handler()`
- Pattern: `scan(@Req() req: AuthenticatedRequest) { return implement(...).handler(({ input }) => { const actorId = req.stackAuth?.sub ?? 'unknown'; ... }); }`

### New contract namespace pattern
- A new `discover` namespace was added to the root contract in `packages/api-contract/src/index.ts`
- Add to `oc.prefix('/api').router({ games: ..., discover: DiscoverContract })`
- Export from `index.ts` via `export * from './discover'`

### GamesModule exports
- `GamesService` and `IgdbService` are now exported from `GamesModule`
- Other modules (like `DiscoverModule`) can import `GamesModule` and inject these services

### Domain Events table
- `domainEvents` table added to `packages/api-contract/src/schema.ts`
- Migration generated at `apps/api/drizzle/0011_simple_whirlwind.sql`

### pg_trgm GIN index migration (migration 0012)
- GIN index `game_name_trgm_idx` created on `game.name` with `gin_trgm_ops`
- Use `CREATE INDEX` (NOT `CONCURRENTLY`) — Drizzle runs migrations in a transaction
- No `CREATE EXTENSION` needed — already installed on all environments
- `similarity(name, ${q}) DESC` via Drizzle `sql` template tag for relevance ordering
- Snapshot files: copy previous snapshot verbatim, update only `id` (new UUID) and `prevId` (previous snapshot id)

### Drizzle manual migration workflow
- SQL file: `apps/api/drizzle/<idx>_<tag>.sql`
- Journal: `apps/api/drizzle/meta/_journal.json` — add new entry with idx, version, when (ms timestamp), tag, breakpoints: true
- Snapshot: `apps/api/drizzle/meta/<idx>_snapshot.json` — copy previous, update `id` and `prevId`
- Run with: `bun run db:migrate` inside `apps/api`

### lib/hooks barrel
- No `index.ts` barrel exists in `apps/web/lib/hooks/` — hooks are imported by direct file path

### useGameSearch hook pattern
- Located at `apps/web/lib/hooks/use-game-search.ts`
- Debounces query internally with `useDebounce(query, 300)`
- `isLoading` = `query !== debouncedQuery || isFetching` (covers both typing lag and network lag)
- `isIdle` = `debouncedQuery.length < 2`
- `staleTime: 30_000` consistent with other validation hooks

## Details File
See `patterns.md` for extended notes including SSE auth, background jobs, Drizzle migration commands, and Checkbox usage.
