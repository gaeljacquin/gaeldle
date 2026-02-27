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

## Shared Dashboard Components

### DashboardPageHeader

`apps/web/components/dashboard-header.tsx` — reusable sticky-header component used across all dashboard pages (Dashboard, Settings, Bulk Image Gen, Add Game, Replace Game).

```tsx
import { DashboardPageHeader } from '@/components/dashboard-header';

<DashboardPageHeader
  title="My Page"
  description="Short description shown below the title."
  icon={IconSomeTablerIcon}
/>
```

Props:
- `title: string` — page title rendered in an `<h1>`.
- `description: string` — subtitle rendered in a `<p>` with muted foreground color.
- `icon: Icon` — a Tabler Icons `Icon` component rendered inline before the title (22px, `text-primary`).

All dashboard views should use this component inside the sticky `border-b bg-card/50 backdrop-blur-sm` header wrapper rather than writing their own heading markup.

## Admin Dashboard Pages

Two new dashboard pages handle game catalogue management:

| Route | View file | Description |
|---|---|---|
| `/dashboard/add-game` | `apps/web/views/add-game.tsx` | Add one or more new games to the DB by IGDB ID. Max `ADD_GAME_MAX_ROWS` (20) rows per submission. |
| `/dashboard/replace-game` | `apps/web/views/replace-game.tsx` | Replace existing games by swapping IGDB IDs. Max `REPLACE_GAME_MAX_ROWS` (20) pairs per submission. |

Both pages use a validate-then-commit pattern: each row validates in real time via a debounced TanStack Query call, and the submit button is only enabled when all rows pass validation.

### Validation Hooks

#### `useIgdbIdAddValidation`

`apps/web/lib/hooks/use-igdb-id-add-validation.ts`

Validates a single IGDB ID string for addition. Debounces the input by 600 ms before firing the API call. Returns `IgdbIdAddValidationState`:

```ts
interface IgdbIdAddValidationState {
  isLoading: boolean;      // true while typing or fetching
  isReady: boolean;        // true once a result has been received
  existsOnIgdb: boolean | null;
  alreadyInDb: boolean | null;
  gameName: string | null;
  canAdd: boolean;         // true only when existsOnIgdb && !alreadyInDb
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
  sameIds: boolean;                          // true when both IDs are equal
  currentExistsInDb: boolean | null;
  currentGameName: string | null;
  replacementExistsOnIgdb: boolean | null;   // null if current doesn't exist in DB
  replacementAlreadyInDb: boolean | null;    // null if current doesn't exist in DB
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
