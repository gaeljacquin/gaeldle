# Frontend Conventions (apps/web)

## Tech Stack

- **Framework**: Next.js 15 (App Router).
- **Styling**: Tailwind CSS v4.
- **UI Components**: Base UI + custom components.
- **Icons**: Tabler Icons (`@tabler/icons-react`).
- **Auth**: Stack Auth.
- **State Management**: Zustand (stores) and TanStack Query (API).

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
- **No Direct Data Access**: No `fetch`, `axios`, or direct data access inside components. Use `lib/services/`.
- **Custom Hooks**: Complex stateful logic, especially game logic, belongs in `lib/hooks/`.
- **Views**: Complex pages should have their main content in `views/` to keep `app/` files clean.
- **Centralized Providers**: All context providers (Stack Auth, Query Client, etc.) are consolidated in `apps/web/app/providers.tsx`.
- **Layout Constraints**: The `LayoutWrapper` handles the conditional visibility of the Navbar and Footer. For example, they are hidden for `/handler` and `/dashboard` routes.