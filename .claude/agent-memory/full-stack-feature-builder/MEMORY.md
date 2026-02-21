# Gaeldle Agent Memory

## Package Manager
- Use `bun` for all commands (not pnpm or npm)
- `bun run lint` — runs turbo lint across all packages
- Do NOT run `pnpm type-check` (global rule)

## Monorepo Structure
- `apps/web` — Next.js 15 App Router frontend
- `apps/api` — NestJS backend
- `packages/api-contract` — oRPC contracts (source of truth for types)

## Frontend Architecture (`apps/web`)
- `app/` — thin route pages (Server Components by default, no logic)
- `views/` — `'use client'` views with TanStack Query hooks, business logic
- `components/` — purely presentational, props-driven, no API calls
- `lib/services/` — API service functions (oRPC client OR raw fetch for non-contract endpoints)
- `lib/hooks/` — custom stateful hooks
- `lib/stores/` — Zustand stores

## Key Patterns

### Page file pattern
```tsx
import SomeView from '@/views/some-view';
export default function SomePage() { return <SomeView />; }
```

### View file pattern — `'use client'`, TanStack Query
- Sticky header with title + controls
- `container mx-auto px-4` for layout
- `isLoading && !data` for initial loading state with spinner

### Service file pattern
- For oRPC routes: `import { orpcClient } from '@/lib/orpc'`
- For non-oRPC (e.g. health endpoint): raw `fetch` with try/catch returning synthetic error shape
- API base URL: `process.env.serverUrl || 'http://localhost:8080'`

### Styling
- Theme: Teal, Figtree font (var --font-sans), JetBrains Mono (var --font-mono)
- `font-mono` class = JetBrains Mono for technical details
- `cn` utility from `@/lib/utils` for conditional classNames
- Radius: 0 (sharp corners everywhere)
- Primary color: teal hsl(171 77% 37%)
- Icons: `@tabler/icons-react` — IconHeartbeat, IconCircleCheck, IconCircleX, IconRefresh confirmed available in v3.36.1
- Always add `aria-hidden="true"` to decorative icons
- Always add `aria-live="polite"` to async-updated status regions
- `border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10` — sticky header pattern

### Button component
- Located at `@/components/ui/button`
- Uses Base UI primitive + CVA
- Size variants: `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`
- All corners are sharp (radius: 0)

## Details File
See `patterns.md` for extended notes.
