# Gaeldle Web

The Next.js frontend for Gaeldle.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **Theming**: Teal theme (Radius 0, Figtree font) generated via [shadcn/ui](https://ui.shadcn.com/create?base=base&style=lyra&baseColor=gray&theme=teal&iconLibrary=tabler&font=figtree&radius=none)
- **UI Foundations**: Base UI
- **Icons**: Tabler Icons
- **Auth**: Stack Auth
- **Data Fetching**: TanStack Query (React Query)
- **State Management**: Zustand

## Development

### Setup

Ensure you have configured the environment variables in `.env.local` (see `.env.example`).

### Commands

```bash
bun dev          # Start development server
bun run build    # Build for production
bun run lint     # Run ESLint
bun run type-check # Run TypeScript type checking
```

## Architecture

- **`app/`**: Routes and layout definitions.
- **`views/`**: Reusable page-level components.
- **`components/`**: Presentational UI components.
  - **`ui/`**: Low-level UI primitives (buttons, inputs, etc.).
- **`lib/`**: Core logic.
  - **`hooks/`**: Custom React hooks (game logic, state).
  - **`services/`**: API integration services.
  - **`stores/`**: Zustand global state stores.
  - **`utils/`**: Helper functions.
- **`stack/`**: Stack Auth integration.