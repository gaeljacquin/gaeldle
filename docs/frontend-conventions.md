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
  - Write operations (delete, sync, image gen, add game, replace game, validate IGDB IDs) use the oRPC client (`orpcClient`) to communicate with NestJS.
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

Usage: import `Stuck` from `@/components/stuck` and render `<Stuck stuckState='loading' />` for game loading states, or `<Stuck stuckState='none' className="..." />` when embedding inside a fixed-size container.

## Admin Dashboard Pages

Dashboard pages for game catalogue management and utilities. The sidebar exposes a single **Utilities** link (`/dashboard/utilities`) that acts as a hub for all admin tool pages.

| Route                       | View file                           | Description                                                                                         |
| --------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| `/dashboard/utilities`      | `apps/web/views/utilities.tsx`      | Hub page listing all admin utility tools as `MenuCard` tiles.                                       |
| `/dashboard/add-game`       | `apps/web/views/add-game.tsx`       | Add one or more new games to the DB by IGDB ID. Max `ADD_GAME_MAX_ROWS` (20) rows per submission.   |
| `/dashboard/replace-game`   | `apps/web/views/replace-game.tsx`   | Replace existing games by swapping IGDB IDs. Max `REPLACE_GAME_MAX_ROWS` (20) pairs per submission. |
| `/dashboard/image-gen`      | `apps/web/views/image-gen.tsx`      | Bulk AI image generation for games.                                                                 |
| `/dashboard/discover-games` | `apps/web/views/discover-games.tsx` | Browse and discover games from IGDB; select games to add to the library.                            |

The Add Game and Replace Game pages use a validate-then-commit pattern: each row validates in real time via a debounced TanStack Query call, and the submit button is only enabled when all rows pass validation.

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

### Row-level Validation Components

- `apps/web/components/igdb-id-add-row.tsx` — single row for the Add Game form; renders an IGDB ID input and an inline validation badge.
- `apps/web/components/igdb-id-pair-row.tsx` — single row for the Replace Game form; renders current + replacement inputs with inline validation badges.
- `apps/web/components/igdb-add-validation-badge.tsx` — displays the validation result (spinner, game name, error states) for a single IGDB ID add row.

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

## Game Mode Behavioral Contracts

### Skip Button (Cover Art and Artwork)

The Cover Art and Artwork game modes expose a **Skip** button in `GameListPlusImage` (`apps/web/components/game-list-plus-image.tsx`). The skip button is absent in Image Gen (same component, different `gameModeSlug`).

- Clicking Skip calls `handleSkip()` from `useCoverArtGame` (`apps/web/lib/hooks/use-cover-art-game.ts`), then clears the search input.
- `handleSkip` appends `null` to the `wrongGuesses` array (instead of a `Game` object) and decrements `attemptsLeft`. This preserves attempt-slot alignment while recording that a guess was skipped.
- If decrementing brings `attemptsLeft` to 0, `isGameOver` is set to `true` immediately.
- The `wrongGuesses` array type is `(Game | null)[]`. Code that derives `wrongGuessIds` from this array must filter out `null` entries before mapping to `.id`.
- The Skip button is disabled when `isGameOver` is `true`.
