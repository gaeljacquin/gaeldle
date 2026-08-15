# Discover Games — Final Architecture Design (2026-03-03)

## Status: APPROVED, ready for handoff to @full-stack-feature-builder

## Key Decisions

- **New DiscoverController** in `apps/api/src/discover/discover.router.ts`
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

Use NestJS `@Req() req: AuthenticatedRequest` parameter on the controller method to access the Express request and `req.stackAuth?.sub`.

## File Tree

```
packages/
  api-client/              # Generated openapi-fetch client and schema

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
