# Discover Games — Final Architecture Design (2026-03-03)

## Status: APPROVED, ready for handoff to @full-stack-feature-builder

## Key Decisions

- **New DiscoverContract** separate from GamesContract in `packages/api-contract/src/discover.ts`
- **New DiscoverModule** in `apps/api/src/discover/` — IgdbService shared via GamesModule export
- **IGDB query**: no exclusion list; fetch freely, post-filter against DB; `category=0 & status=0 & total_rating_count > 50 & themes != (42)`
- **isAlreadyAdded flag**: candidates include all IGDB results; backend checks igdbIds against DB and marks already-present ones
- **Two-event pattern**: `discover_games.scanned` written at scan time; `discover_games.applied` written at apply time
- **actorId**: extracted from `request.stackAuth.sub` (JWT `sub` claim, set by StackAuthGuard on `request.stackAuth`)
  - No existing handler reads this — this feature is the FIRST to use it
  - Pattern: inject `@Req() req: Request & { stackAuth?: JWTPayload }` in the router handler, pass `req.stackAuth?.sub` to the service
- **Event store**: new `domain_event` table, append-only, extensible to Add/Replace Game in the future
- **Count input**: number input, default 10, range 1–50 (`DISCOVER_GAMES_MAX = 50`, `DISCOVER_GAMES_DEFAULT = 10` in constants)
- **Scan result persistence**: in-memory (component state) for UI; DB for audit (domain_event row at scan time)
- **Cover image size**: `t_cover_big` (264x374) — swap `t_thumb` with `t_cover_big` in the URL

## IGDB IgdbGame type change
- Add `category?: number` and `status?: number` to the `IgdbGame` type in `igdb.service.ts`
- Add to `discoverCandidates()` fields array: `category`, `status`, `themes.id` (themes.id needed for where clause — existing `themes.name` fetch is separate)
- Apicalypse where: `category = 0 & status = 0 & total_rating_count > 50 & themes != (42)`
- Sort: `total_rating_count desc`
- Limit: `count` param (1–50)

## actorId Pattern (NEW — first use in this codebase)
In `discover.router.ts`, the `apply` handler must receive the raw request to read `stackAuth.sub`:
```ts
import { Req } from '@nestjs/common';
import type { Request } from 'express';
import type { JWTPayload } from 'jose';

// Inside the handler:
handler(async ({ input }, { context }) => {
  // context is oRPC context — does NOT have request
  // Use @Req() decorator on the router method to access the Express request
})
```
Alternative: since oRPC `implement().handler()` does not natively expose the raw Express request, use a NestJS `@Req()` parameter on the method alongside the `implement()` call. Check `@orpc/nest` docs for context injection. If unavailable, use a custom decorator or pass userId via the oRPC input field (signed by the frontend from Stack Auth session — less ideal). Implementation detail for the builder to resolve.

## File Tree
```
packages/
  api-contract/src/
    schema.ts              # MODIFIED: add domainEvents table + Zod schemas
    discover.ts            # NEW: DiscoverContract
    index.ts               # MODIFIED: add discover namespace

  constants/src/
    index.ts               # MODIFIED: DISCOVER_GAMES_MAX=50, DISCOVER_GAMES_DEFAULT=10

apps/api/src/
  games/
    games.module.ts        # MODIFIED: export IgdbService
    igdb.service.ts        # MODIFIED: add discoverCandidates(), add category/status to IgdbGame type
  discover/
    discover.module.ts     # NEW
    discover.router.ts     # NEW
    discover.service.ts    # NEW

apps/web/
  app/dashboard/discover-games/
    page.tsx               # NEW
  views/
    discover-games.tsx     # NEW
  components/
    discovered-game-card.tsx  # NEW
  lib/
    services/
      discover.service.ts  # NEW
    hooks/
      use-discover-games.ts # NEW
  components/sidebar.tsx   # MODIFIED: add Discover Games link (IconZoomScan)
```
