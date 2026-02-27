# Docs Writer Agent Memory

## Project Structure

- Monorepo: Turborepo with `apps/web` (Next.js 16) and `apps/api` (NestJS).
- Web app router pages: `apps/web/app/` (routes), views: `apps/web/views/`, components: `apps/web/components/`.
- Game mode config (titles, descriptions, difficulty, slugs): `apps/web/lib/game-mode.ts`.
- Game hook files: `apps/web/lib/hooks/use-<mode>-game.ts` — contain `MAX_ATTEMPTS` and game logic.
- Docs: `docs/agents/` contains architecture.md, backend-conventions.md, commands.md, frontend-conventions.md, workflows.md.
- Game modes user-facing doc: `docs/game-modes.md` (full rules and mechanics for all six modes).
- Public README at repo root `/Users/gael/Documents/projects/gaeldle/README.md` is a glossary/doc index only.

## Game Modes (as of 2026-02-20)

| Slug | Title | Difficulty | Max Attempts | Hook file |
|---|---|---|---|---|
| cover-art | Cover Art | Easy | 5 | use-cover-art-game.ts |
| artwork | Artwork | Medium | 5 | use-cover-art-game.ts (shared) |
| image-gen | Image Gen | Medium | 5 | use-cover-art-game.ts (shared) |
| timeline | Timeline | Medium | 3 | use-timeline-game.ts |
| timeline-2 | Timeline 2 | Hard | 7 | use-timeline-2-game.ts |
| specifications | Specifications | Hard | 10 | use-specifications-game.ts |

Cover Art, Artwork, and Image Gen all use the `GameListPlusImage` component and `useCoverArtGame` hook.

## README Convention

- Root README is a glossary/doc index: brief project intro + a table linking to every file in `docs/`.
- Game modes detail lives in `docs/game-modes.md`, not the README.
- Developer/architecture rules go in `docs/agents/` files (see AGENTS.md for the list).
- README must not contain detailed content (env vars, ports, build commands, game mode rules) — link to the relevant doc file instead.

## API Architecture (as of 2026-02-26)

Game operations are split between two APIs:
- **Reads** (list, search, random, artwork, get-by-igdbId): Next.js route handlers in `apps/web/app/api/games/`. DB accessed directly via Drizzle singleton at `apps/web/lib/db.ts`. Service layer uses plain `fetch`. No oRPC contract.
- **Writes** (delete, sync, generateImage, bulkGenerateImages, validateIgdbIdAdd, validateReplaceGame, replaceGames): NestJS via `orpcClient`. Covered by `packages/api-contract`.

New NestJS write endpoints added 2026-02-25/26:
- `POST /games/add/validate-one` — validate a single IGDB ID before adding.
- `POST /games/replace-game/validate-one` — validate a current/replacement IGDB ID pair.
- `POST /games/replace-games` — replace up to 20 games by swapping IGDB IDs. Returns `status: 'updated'|'skipped'|'error'` per pair.

IgdbService (`apps/api/src/games/igdb.service.ts`) added as a NestJS injectable with `getGameById` and `getGamesByIds`. Caches Twitch OAuth token internally.

Health page (`/health`) monitors both APIs:
- "writes api" = NestJS ping via `GET /`
- "reads api" = Next.js ping via `GET /api/games?pageSize=1`

Architecture doc updated: `docs/agents/architecture.md` — see "API Responsibility Split" section.
Backend doc updated: `docs/agents/backend-conventions.md` — see "Next.js API Routes" section.
Frontend doc updated: `docs/agents/frontend-conventions.md` — revised "Read vs. write transport" rule.

## Admin Dashboard Pages (as of 2026-02-26)

Two new dashboard pages added:
- `/dashboard/add-game` — view: `apps/web/views/add-game.tsx`. Add games by IGDB ID (max 20). Uses `useIgdbIdAddValidation` hook.
- `/dashboard/replace-game` — view: `apps/web/views/replace-game.tsx`. Replace games by IGDB ID pair (max 20). Uses `useReplaceGameValidation` hook.

Both use a validate-then-commit pattern with 600 ms debounce on inputs.

Shared dashboard UI component: `DashboardPageHeader` in `apps/web/components/dashboard-header.tsx`. All dashboard views must use it.

Shared constants consolidated into `packages/constants/src/index.ts`: `TEST_DIR`, `IMAGE_GEN_DIR`, `REPLACE_GAME_MAX_ROWS`, `ADD_GAME_MAX_ROWS`, `PLACEHOLDER_IMAGE`, `PLACEHOLDER_IMAGE_R2`, `FILE_SIZE_LIMIT`. Import from `@gaeldle/constants` in both web and API code — do not add to app-local constants files.

Timeline swap-mode visual indicator (green line on drag-over) was reverted (commit 64beaa8) because the green line was inaccurate and broke shift mode. `DragOverEvent` handler and `overId` state were removed from `apps/web/views/timeline.tsx`.

## Key Behavioral Details (for README accuracy)

- Cover Art / Artwork: pixelated image that clears with each wrong guess; clarity bar shown.
- Image Gen: AI-generated image, no pixelation, image never changes.
- Timeline: 10 random games, drag-and-drop to sort chronologically; Shift/Swap drag modes; correctly placed cards lock.
- Timeline 2: growing timeline, one card dealt at a time, drag into correct slot; wrong placements add card at correct position and cost an attempt; score = correct placements.
- Specifications: 8 fields compared (Platforms, Genres, Themes, Release Year, Game Modes, Game Engines, Publisher, Player Perspective); green/yellow/red feedback; one hint available per game (costs 1 attempt).
