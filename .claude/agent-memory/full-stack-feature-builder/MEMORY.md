# Gaeldle Agent Memory

## Package Manager

- Use `nr` for all commands (unified package manager tool)
- `nr lint` — runs turbo lint across all packages
- Do NOT run `pnpm type-check` (use `nr typecheck` instead)

## Monorepo Structure

- `apps/web` — Next.js 16 App Router frontend
- `apps/web` — Next.js 16 App Router frontend
- `apps/api` — NestJS backend (exposes OpenAPI spec at openapi.json)
- `packages/api-client` — Generated openapi-fetch client and TypeScript schema (`@workspace/api-client`)

## Frontend Architecture (`apps/web`)

- `app/` — thin route pages (Server Components by default, no logic)
- `views/` — `'use client'` views with TanStack Query hooks, business logic
- `components/` — purely presentational, props-driven, no API calls
- `lib/services/` — API service functions (`apiClient` from `@workspace/api-client` OR raw fetch for local Next.js API routes)
- `lib/hooks/` — custom stateful hooks
- `lib/stores/` — Zustand stores

## Key Patterns

### Page file pattern

```tsx
import SomeView from '@/views/some-view';
export default function SomePage() {
  return <SomeView />;
}
```

### View file pattern — `'use client'`, TanStack Query

- Sticky header with title + controls
- `container mx-auto px-4` for layout
- `isLoading && !data` for initial loading state with spinner

### Service file pattern

- For NestJS write endpoints: `import { apiClient } from '@/lib/api-client'`
- For local Next.js API read routes: raw `fetch` with try/catch returning synthetic error shape

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

- Located at `@workspace/ui/button`
- Uses Base UI primitive + CVA
- Size variants: `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`
- All corners are sharp (radius: 0)

### Date Serialization (CRITICAL)

- OpenAPI fetch client returns Date fields as ISO strings, NOT Date objects
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

### actorId injection in NestJS Controllers

- Use `@Req() req: AuthenticatedRequest` on the controller method to access Stack Auth payload
- Extract `req.stackAuth?.sub` for `actorId`

### GamesModule exports

- `GamesService` and `IgdbService` are now exported from `GamesModule`
- Other modules (like `DiscoverModule`) can import `GamesModule` and inject these services

### Domain Events table

- `domainEvents` table added to `apps/api/src/db/schema/domain-event.ts` exported via `@workspace/api/db`
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
- Run with: `nr db:migrate` inside `apps/api`

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
