# Frontend Conventions (apps/web)

## Tech Stack

- **Framework**: Next.js 16 (App Router).
- **Styling**: Tailwind CSS v4.
- **UI Components**: Base UI + custom components.
- **Icons**: Tabler Icons (`@tabler/icons-react`).
- **Auth**: Stack Auth.
- **State Management**: Zustand (stores) and TanStack Query (API).

## Best Practices & Specialized Skills

This project follows Vercel's React best practices. Agents MUST use the following skills when developing frontend features:

- `vercel-react-best-practices`: Core React/Next.js implementation standards.
- `vercel-composition-patterns`: Component composition and structure patterns.
- `web-design-guidelines`: UI/UX and design consistency.

These skills are located in `apps/web/.agents/skills/`.

## Theming & Styling

- **Theme**: Teal (Gray base, Radius 0, Lyra style).
- **Generator**: [shadcn/ui Theme Generator](https://ui.shadcn.com/create?base=base&style=lyra&baseColor=gray&theme=teal&iconLibrary=tabler&font=figtree&radius=none)
- **Typography**:
  - Sans: **Figtree** (Primary)
  - Mono: **JetBrains Mono** (Technical details/Dev mode)
- **Global Styles**: Scrollbars are disabled globally via `globals.css`.

## Separation of Concerns (Critical)

All frontend code must separate business logic from components and views.

### Structure

```
apps/web/
├── app/              # Routes and Pages
├── views/            # Main page content components (reusable across routes if needed)
├── components/       # Presentation-only components
│   └── ui/           # Base UI primitives
├── lib/              # Business logic
│   ├── services/     # API calls and external integrations
│   ├── hooks/        # Stateful/custom logic (game loops, etc.)
│   ├── stores/       # Global state (Zustand)
│   ├── utils/        # Pure utilities and transforms
│   └── types/        # TypeScript types
├── stack/            # Stack Auth configuration
```

### Rules

- **Pure Components**: Components in `components/` are presentational only and receive data via props. They should not have side effects or fetch data.
- **API calls via services**: All API communication must go through service functions in `lib/services/`. Components and hooks must not call `fetch` directly.
- **Read vs. write transport**:
  - Read operations (game lists, search, random, artwork) call the local Next.js API routes via plain `fetch` inside `lib/services/game.service.ts`.
  - Write operations (delete, sync, image gen, add game, replace game, validate IGDB IDs) use `apiClient` from `@workspace/api-client` to communicate with NestJS.
- **No Direct Data Access**: No raw `fetch` or `axios` calls inside components or hooks. Call the service layer instead.
- **Custom Hooks**: Complex stateful logic, especially game logic, belongs in `lib/hooks/`.
- **Views**: Complex pages should have their main content in `views/` to keep `app/` files clean.
- **Centralized Providers**: All context providers (Stack Auth, Query Client, etc.) are consolidated in `apps/web/app/providers.tsx`.
- **Layout Constraints**: The `LayoutWrapper` handles the conditional visibility of the Navbar and Footer. For example, they are hidden for `/handler` and `/dashboard` routes.

## Shared UI Components

### DashboardPageHeader

`apps/web/components/dashboard-header.tsx` — reusable sticky-header component used across all dashboard pages (Dashboard, Settings, Bulk Image Gen, Add Game, Replace Game, Utilities).

```tsx
import { DashboardPageHeader } from '@/components/dashboard-header';

<DashboardPageHeader
  title="My Page"
  description="Short description shown below the title."
  icon={IconSomeTablerIcon}
/>;
```

Props:

- `title: string` — page title rendered in an `<h1>`.
- `description: string` — subtitle rendered in a `<p>` with muted foreground color.
- `icon: Icon` — a Tabler Icons `Icon` component rendered inline before the title (22px, `text-primary`).

All dashboard views should use this component inside the sticky `border-b bg-card/50 backdrop-blur-sm` header wrapper rather than writing their own heading markup.

### MenuCard

`apps/web/components/menu-card.tsx` — generic gradient card component used to render clickable navigation tiles. Renders a gradient background, icon in the top-right corner, title, description, and an optional `badge` slot (used by `GameModeCard` to render the difficulty label).

```tsx
import { MenuCard, type MenuCardProps } from '@/components/menu-card';

<MenuCard
  href="/dashboard/some-page"
  title="Some Page"
  description="Short description."
  icon={IconSomeTablerIcon}
  gradient="--gradient-easy"
/>;
```

Props:

- `href?: string` — if omitted or `disabled`, renders a non-linked `<div>` instead of a `<Link>`.
- `title: string` — card heading.
- `description: string` — subtitle below the heading.
- `icon: TablerIcon` — Tabler icon rendered in the top-right corner.
- `gradient: string` — CSS variable name for the card background (e.g. `'--gradient-easy'`).
- `disabled?: boolean` — disables the link and reduces opacity.
- `badge?: React.ReactNode` — optional slot rendered above the icon (used by `GameModeCard` for the difficulty badge).

`GameModeCard` (`apps/web/components/game-mode-card.tsx`) extends `MenuCard` and adds a `difficulty: 'Easy' | 'Medium' | 'Hard'` prop, rendering the value as a `badge`.

### Stuck

`apps/web/components/stuck.tsx` — shared loading/stuck-state display component used in place of inline loading markup.

Props:

- `stuckState: 'none' | 'loading'` — `'loading'` renders a full-screen centered layout; `'none'` renders a compact inline block suitable for embedding inside a card or image placeholder.
- `className?: string` — forwarded to the wrapper `div` when `stuckState === 'none'`.

### GameListControls & GameListContent

The game catalogue and list views are decomposed into reusable presentation components and hooks:

- **`GameListControls`** (`apps/web/components/game-list-controls.tsx`): Shared search, filter, and pagination bar. Encapsulates title search input, IGDB ID search, sorting dropdowns, page size selector (supports 10, 25, 50, 100), view mode toggles (grid, table, compact), multi-select toggle, and bulk deletion confirmation dialog.
- **`GameListContent`** (`apps/web/components/game-list-content.tsx`): Renders game listings across grid, table, or compact layout with multi-selection checkboxes, empty state handling, and clear search actions.
- **`LibraryFilterToggleGroup`** (`apps/web/components/library-filter-toggle-group.tsx`): Platform filter toggles (`all`, `owned`, `demos`) used in platform-specific views such as Steam and Nintendo.
- **`DashboardBacklink`** (`apps/web/components/dashboard-backlink.tsx`): Smart back button that returns to the user's previous origin page (e.g. library or wishlist), defaulting safely to `/dashboard`.

### Catalogue Filtering & Store Architecture

- **`useGameListFilters`** (`apps/web/lib/hooks/use-game-list-filters.ts`): Reusable hook handling query parameters, debounced input, and TanStack Form state for search, sorting, and pagination.
- **`useGameListStore`** (`apps/web/lib/stores/game-list-store.ts`): Replaces `dashboard-store.ts`. Manages client-side list state: active view mode (`grid` | `table` | `compact`), `isMultiSelect`, and `selectedIds` set for bulk actions.

## Store Library & Wishlist Pages

The sidebar exposes dedicated, collapsible **Library** and **Wishlist** sections allowing users to browse their synced game collections by platform:

| Section  | Route                               | View file                                      |
| -------- | ----------------------------------- | ---------------------------------------------- |
| Library  | `/dashboard/library/steam`          | `apps/web/views/library-steam.tsx`             |
| Library  | `/dashboard/library/epic`           | `apps/web/views/library-epic.tsx`              |
| Library  | `/dashboard/library/gog`            | `apps/web/views/library-gog.tsx`               |
| Library  | `/dashboard/library/nintendo`       | `apps/web/views/library-nintendo.tsx`          |
| Library  | `/dashboard/library/amazon`         | `apps/web/views/library-amazon.tsx`            |
| Library  | `/dashboard/library/xbox`           | `apps/web/views/library-xbox.tsx`              |
| Wishlist | `/dashboard/wishlist/steam`         | `apps/web/views/wishlist-steam.tsx`            |
| Wishlist | `/dashboard/wishlist/epic`          | `apps/web/views/wishlist-epic.tsx`             |
| Wishlist | `/dashboard/wishlist/nintendo`      | `apps/web/views/wishlist-nintendo.tsx`         |
| Wishlist | `/dashboard/wishlist/xbox`          | `apps/web/views/wishlist-xbox.tsx`             |
| Wishlist | `/dashboard/wishlist/humble-bundle` | `apps/web/views/wishlist-humble-bundle.tsx`     |

## Admin Dashboard Pages

Dashboard pages for game catalogue management and utilities. The sidebar exposes a single **Utilities** link (`/dashboard/utilities`) that acts as a hub for all admin tool pages.

| Route                       | View file                           | Description                                                                                            |
| --------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `/dashboard/utilities`      | `apps/web/views/utilities.tsx`      | Hub page listing all admin utility tools as `MenuCard` tiles.                                          |
| `/dashboard/add-game`       | `apps/web/views/add-game.tsx`       | Add one or more new games to the DB by IGDB ID. Max `ADD_GAME_MAX_ROWS` (20) entries per submission.    |
| `/dashboard/replace-game`   | `apps/web/views/replace-game.tsx`   | Replace existing games by swapping IGDB IDs. Max `REPLACE_GAME_MAX_ROWS` (20) pairs per submission.    |
| `/dashboard/image-gen`      | `apps/web/views/image-gen.tsx`      | Bulk AI image generation for games.                                                                    |
| `/dashboard/discover-games` | `apps/web/views/discover-games.tsx` | Browse and discover games from IGDB; select games to add to the library.                               |

The Add Game and Replace Game pages use a validate-then-commit pattern: each entry or row validates in real time via a debounced TanStack Query call, and the submit button is only enabled when all entries/rows pass validation.

### Validation Hooks

#### `useIgdbIdAddValidation`

`apps/web/lib/hooks/use-igdb-id-add-validation.ts`

Validates a single IGDB ID string for addition. Debounces the input by 600 ms before firing the API call. Returns `IgdbIdAddValidationState`:

```ts
interface IgdbIdAddValidationState {
  isLoading: boolean; // true while typing or fetching
  isReady: boolean; // true once a result has been received
  existsOnIgdb: boolean | null;
  alreadyInDb: boolean | null;
  gameName: string | null;
  canAdd: boolean; // true only when existsOnIgdb && !alreadyInDb
}
```

Query key: `['igdb-add-validate', debouncedInt]`. Stale time: 30 s.

#### `useReplaceGameValidation`

`apps/web/lib/hooks/use-replace-game-validation.ts`

Validates a current/replacement IGDB ID pair string. Both fields are debounced by 600 ms. Returns `ReplaceGameValidationState`:

```ts
interface ReplaceGameValidationState {
  isLoading: boolean;
  isReady: boolean;
  sameIds: boolean; // true when both IDs are equal
  currentExistsInDb: boolean | null;
  currentGameName: string | null;
  replacementExistsOnIgdb: boolean | null; // null if current doesn't exist in DB
  replacementAlreadyInDb: boolean | null; // null if current doesn't exist in DB
  replacementGameName: string | null;
  canApply: boolean;
}
```

Query key: `['replace-game-validate', debouncedCurrentInt, debouncedReplacementInt]`. Stale time: 30 s.

### Row and Entry Validation Components

- `apps/web/components/igdb-id-add-entry.tsx` — single entry for the Add Game form; renders an IGDB ID input and an inline validation badge.
- `apps/web/components/igdb-id-pair-row.tsx` — single row for the Replace Game form; renders current + replacement inputs with inline validation badges.
- `apps/web/components/igdb-add-validation-badge.tsx` — displays the validation result (spinner, game name, error states) for a single IGDB ID add entry.

### Duplicate Detection (Replace Game)

The Replace Game view tracks duplicate IGDB IDs across all rows client-side. A row is flagged as a duplicate if the same IGDB ID appears more than once in the current column, more than once in the replacement column, or the same ID appears in both the current column of one row and the replacement column of another. Duplicate rows are highlighted and excluded from submission.

## Game Search

### `useGameSearch` Hook

`apps/web/lib/hooks/use-game-search.ts` — TanStack Query hook that wraps `searchGames()` from `game.service.ts` with debouncing and idle-state tracking.

```ts
const { results, isLoading, isIdle, debouncedQuery } = useGameSearch(query, {
  mode,
  limit,
});
```

Options:

- `mode?: GameModeSlug` — filters results to games eligible for that game mode.
- `limit?: number` — passed to the search endpoint (server default is 20).

Return values:

- `results: Game[]` — search results, empty array while idle or loading.
- `isLoading: boolean` — `true` while the live query differs from the debounced query (typing lag) OR while the query is fetching. Use this to show a "Searching..." indicator.
- `isIdle: boolean` — `true` when `debouncedQuery.length < GAME_SEARCH_MIN_CHARS` (3). No API call is made in this state.
- `debouncedQuery: string` — the debounced value of the raw query input (debounce delay: 300 ms). Pass this to `highlightMatch` to bold the query in rendered results.

Query key: `['game-search', debouncedQuery, mode]`. Stale time: 30 s. Query is disabled when `isIdle` is `true`.

### Match Highlighting

`GameSearch` (`apps/web/components/game-search.tsx`) contains a `highlightMatch(name, query)` helper that bolds the first case-insensitive occurrence of the debounced query within a result name. It wraps the matched substring in `<strong>` and returns a `<span>` with surrounding text as plain text nodes. No match is highlighted when `query.length < GAME_SEARCH_MIN_CHARS`.

## Game Mode Behavioral Contracts & UI Patterns

### Skip Button (Cover Art, Artwork, Image Gen, Clue)

The guessing game modes expose a **Skip** button in `GameListPlusImage` (`apps/web/components/game-list-plus-image.tsx`) and game hooks (`useCoverArtGame`, `useClueGame`):

- Clicking Skip calls `handleSkip()`, then clears the search input.
- `handleSkip` appends `null` to the `wrongGuesses` array (instead of a `Game` object) and decrements `attemptsLeft`. This preserves attempt-slot alignment while recording that a guess was skipped.
- If decrementing brings `attemptsLeft` to 0, `isGameOver` is set to `true` immediately.
- The `wrongGuesses` array type is `(Game | null)[]`. Code that derives `wrongGuessIds` from this array must filter out `null` entries before mapping to `.id`.
- The Skip button is disabled when `isGameOver` is `true`.

### Guess History & Contextual Badges

`apps/web/components/guess-history-inline.tsx` displays past attempts in reverse chronological order:
- **Skipped Guess**: Renders a dedicated `-` placeholder card.
- **Franchise Badge**: If a guessed game shares a franchise with the target game (`targetGame.franchises`), an Indigo `Franchise` badge is displayed.
- **Series Badge**: If a guessed game shares a collection with the target game (`targetGame.collections`), a Cyan `Series` badge is displayed.

### Selection and Search Interaction

In `GameListPlusImage` and `Specifications`:
- When no game is selected, the search input and Action buttons (Submit/Skip) are embedded directly within the active guess card.
- When a game is selected, the search box transforms into a pill-shaped badge displaying the game name with a clear button (X) that unselects the game and re-opens the search box.
- The attempts counter is positioned directly under the mode description without borders, rendering used attempts in red.

### Timeline Mode Mechanics

`apps/web/views/timeline.tsx` provides chronological ordering with two interaction modes:
- **Shift Mode**: Drags cards to insert and slide neighboring cards.
- **Swap Mode**: Exposes drag-and-drop swapping between movable cards, with hovered target cards dynamically highlighted.
- **Visual Feedback**: The container's dashed border dynamically matches the active toggle color (Shift vs. Swap).
- **Locking & Reset**: Correctly placed cards lock into place and cannot be swapped. If a previously placed card is moved, the Reset button is enabled.

### Mode Gradient Color Picker

`apps/web/views/edit-modes.tsx` includes an interactive gradient editor allowing administrators to customize game mode card gradients with Start Color, End Color native color pickers, and direct CSS gradient string inputs.

### Game Details Image Generation Tab

`apps/web/components/game-details-image-gen-tab.tsx` provides interactive AI image generation for game details:
- **Layout**: The "Generate image" action button is positioned directly under the generated image container.
- **Collapsible Prompts**: Saved prompts and live prompt preview can be expanded or collapsed via `@workspace/ui`'s `Collapsible` primitive.
- **Delete Generated Image**: Allows deleting a generated image for a selected art style via `deleteGeneratedImage(igdbId, artStyleValue)` (`POST /api/image-gen/delete-image`), which purges the image file from Cloudflare R2 and removes the style entry from the DB `imageGen` array.
- **Replacement Behavior**: When generating an image for an art style that already has an existing image, the old file is deleted from Cloudflare R2 automatically upon successful generation and save.
- **Cross-tab Notifications**: Toast notifications appear even if the user has navigated to other tabs while image generation is in flight.

## UI Primitives (`packages/ui`)

Shared components in `packages/ui/src/components/` include:
- `collapsible.tsx`: Accessible collapsible disclosure primitives (`Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`).
- `toggle.tsx`: Two-state toggle button primitive.
- `toggle-group.tsx`: Grouped toggle buttons (`ToggleGroup`, `ToggleGroupItem`) with single or multiple selection support.
