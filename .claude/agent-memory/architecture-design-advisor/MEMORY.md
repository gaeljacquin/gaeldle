# Architecture Design Advisor - Memory

## Project Summary
Gaeldle: Turborepo monorepo. NestJS API (`apps/api`, port 8080) + Next.js 15 App Router web (`apps/web`, port 3000). Package manager: `bun`. See `docs/agents/architecture.md` for topology.

## Key Packages
- `packages/api-contract`: oRPC contracts + Zod schemas + Drizzle schema. Package: `@gaeldle/api-contract`. Entry: `src/index.ts`, `src/games.ts`, `src/schema.ts`.
- `packages/constants`: `IMAGE_STYLES`, `IMAGE_PROMPT_SUFFIX`, `DEFAULT_IMAGE_GEN_STYLE`. Package: `@gaeldle/constants`.

## Auth Pattern
- `StackAuthGuard` in `apps/api/src/auth/stack-auth.guard.ts` - validates JWT from `x-stack-access-token` or `Authorization: Bearer` header.
- All mutating/privileged endpoints use `@UseGuards(StackAuthGuard)`.
- Dashboard layout at `apps/web/app/dashboard/layout.tsx` gates all routes behind `stackServerApp.getUser({ or: "redirect" })`.
- No role-based authorization exists yet — auth is binary (logged in or not). No admin role concept.

## oRPC Contract Convention
- Defined in `packages/api-contract/src/games.ts` using `oc` from `@orpc/contract`.
- Pattern: `oc.route({ method, path }).input(ZodSchema).output(ZodSchema)`.
- All procedures live in `GamesContract`, mounted at `contract.games.*`.
- Naming: flat noun within the `games` namespace (e.g., `games.list`, `games.generateImage`, `games.deleteBulk`).

## Frontend Conventions
- Pages: `apps/web/app/[route]/page.tsx` — thin wrappers, import from `views/`.
- Views: `apps/web/views/[name].tsx` — main content, client components.
- Services: `apps/web/lib/services/[resource].service.ts` — wraps `orpcClient.*` calls.
- State: TanStack Query (`useQuery`/`useMutation`) for server state. Zustand for complex client state.
- Notifications: `sonner` toast (`toast.success`, `toast.error`, `toast.loading` with `id` for updates).
- cn utility: must be used for conditional classNames.
- Icons: `@tabler/icons-react`.

## Dashboard Structure
- Route group: `apps/web/app/dashboard/` — protected by layout auth gate.
- Sidebar: `apps/web/components/sidebar.tsx` — collapsible, links to `/dashboard`, `/dashboard/settings`, game modes.
- Current pages: `/dashboard` (games list), `/dashboard/settings`, `/dashboard/games/[igdbId]`.
- Navbar/Footer hidden for `/dashboard` routes (via `LayoutWrapper`).

## Existing Image Gen Feature
- Single-game: `contract.games.generateImage` — POST, `@UseGuards(StackAuthGuard)`, takes `igdbId + options`, calls Cloudflare AI, uploads to R2, updates DB.
- Bulk: currently a CLI script only (`apps/api/scripts/bulk-generate-images.ts`). No API endpoint. Iterates games where `ai_image_url IS NULL`, processes serially, reports summary.
- Script params: `NUM_GAMES` (1-50), `IMAGE_STYLE`, `INCLUDE_STORYLINE`, `INCLUDE_GENRES`, `INCLUDE_THEMES` (env vars).

## Key Architectural Tension Observed
- Bulk image gen is long-running (serial Cloudflare AI calls, each takes seconds). HTTP request timeout is a real risk for any naive "run all at once" endpoint. Fire-and-forget or job/polling patterns needed for >5 games.
- No job/queue infrastructure currently exists in the API. BullMQ/Redis would be a new dependency.
