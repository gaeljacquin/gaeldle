# Docs Writer Agent Memory

## Project Structure

- Monorepo: Turborepo with `apps/web` (Next.js 15) and `apps/api` (NestJS).
- Web app router pages: `apps/web/app/` (routes), views: `apps/web/views/`, components: `apps/web/components/`.
- Game mode config (titles, descriptions, difficulty, slugs): `apps/web/lib/game-mode.ts`.
- Game hook files: `apps/web/lib/hooks/use-<mode>-game.ts` — contain `MAX_ATTEMPTS` and game logic.
- Docs: `docs/agents/` contains architecture.md, backend-conventions.md, commands.md, frontend-conventions.md, workflows.md.
- Public README at repo root `/Users/gael/Documents/projects/gaeldle/README.md` is user-facing (non-developer).

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

- Root README is public-facing and user-friendly (not developer docs).
- Developer/architecture rules go in `docs/agents/` files (see AGENTS.md for the list).
- README should not include environment variables, ports, or build commands — those belong in docs/agents/.

## Key Behavioral Details (for README accuracy)

- Cover Art / Artwork: pixelated image that clears with each wrong guess; clarity bar shown.
- Image Gen: AI-generated image, no pixelation, image never changes.
- Timeline: 10 random games, drag-and-drop to sort chronologically; Shift/Swap drag modes; correctly placed cards lock.
- Timeline 2: growing timeline, one card dealt at a time, drag into correct slot; wrong placements add card at correct position and cost an attempt; score = correct placements.
- Specifications: 8 fields compared (Platforms, Genres, Themes, Release Year, Game Modes, Game Engines, Publisher, Player Perspective); green/yellow/red feedback; one hint available per game (costs 1 attempt).
