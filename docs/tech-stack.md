# Tech Stack

## Moving Parts

- **Monorepo**: Turborepo + `ni` (pnpm workspaces)
- **Backend**: Go (apps/newapi)
- **Frontend**: Next.js 16 (App Router)
- **API Protocol**: OpenAPI + openapi-typescript + openapi-fetch (Type-safe communication)
- **Database**: PostgreSQL 17 + Drizzle ORM (@workspace/db)
- **Authentication**: Stack Auth / Hexclave
- **Styling**: Tailwind CSS v4 + Vanilla CSS
- **Icons**: Lucide React
- **Validation**: Zod
- **Testing**: Vitest (Web) + Go tests (API)
- **UI Library**: `packages/ui` (Shared workspace components)

## Monorepo Structure

```
apps/
  newapi/     # Go API (Write operations, Image generation, IGDB sync)
  web/        # Next.js App (Read operations, Game views)
packages/
  api-client/ # Generated openapi-fetch client and TypeScript schema (@workspace/api-client)
  constants/  # Shared workspace constants
  db/         # Database schema & migrations (@workspace/db)
  ui/         # Shared UI component library (@workspace/ui)
docs/         # Developer documentation
.gemini/      # Agent definitions and skills
```

## Getting Started

Make sure you have Node.js, `pnpm`, and PostgreSQL installed and running.

## Commands

Run the development commands in your terminal:

```bash
nr dev        # Start development servers (Turbo)
nr build      # Build all apps and packages
nr test       # Run tests
nr lint       # Lint all packages
nr typecheck  # Run TypeScript type checking
```

## UI Components

Shared components live in `packages/ui/src/components/`. They are consumed by both the web app and any other frontend packages.

```tsx
import { Button } from '@workspace/ui/components/button';
```
