# Tech Stack

## Moving Parts

- **Monorepo**: Turborepo + `ni` (pnpm workspaces)
- **Backend**: NestJS (API)
- **Frontend**: Next.js 16 (App Router)
- **API Protocol**: oRPC (Type-safe communication)
- **Database**: PostgreSQL 17 + Drizzle ORM
- **Authentication**: Stack Auth
- **Styling**: Tailwind CSS v4 + Vanilla CSS
- **Icons**: Lucide React
- **Validation**: Zod
- **Testing**: Vitest (Web) + Jest (API)
- **UI Library**: `packages/ui` (Shared workspace components)

## Monorepo Structure

```
apps/
  api/        # NestJS API (Write operations, Image generation)
  web/        # Next.js App (Read operations, Game views)
packages/
  api-contract/ # Shared oRPC contract and Zod schemas
  constants/    # Shared workspace constants
  ui/           # Shared UI component library (@workspace/ui)
docs/           # Developer documentation
.gemini/        # Agent definitions and skills
```

## Getting Started

1. **Prerequisite**: Use the provided VS Code **Dev Container**. This ensures a consistent environment with Node.js, `ni`, and PostgreSQL.
2. **Security**: The `DEVBOX` environment variable is set inside the container.

### CRITICAL: No Bare Metal
**Do not run `ni`, `nr`, or `nup` on your local host machine (bare metal).** Always use the Dev Container terminal. This isolates your host from potentially compromised npm packages.

## Commands

Run all commands inside the Dev Container terminal:

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
