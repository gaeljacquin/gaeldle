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
  - Write operations (delete, sync, image gen) use the oRPC client (`orpcClient`) to communicate with NestJS.
- **No Direct Data Access**: No raw `fetch` or `axios` calls inside components or hooks. Call the service layer instead.
- **Custom Hooks**: Complex stateful logic, especially game logic, belongs in `lib/hooks/`.
- **Views**: Complex pages should have their main content in `views/` to keep `app/` files clean.
- **Centralized Providers**: All context providers (Stack Auth, Query Client, etc.) are consolidated in `apps/web/app/providers.tsx`.
- **Layout Constraints**: The `LayoutWrapper` handles the conditional visibility of the Navbar and Footer. For example, they are hidden for `/handler` and `/dashboard` routes.
