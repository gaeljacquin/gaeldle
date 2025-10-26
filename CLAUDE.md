# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Gaeldle** is a modern monorepo featuring an Elysia backend and Next.js frontend, orchestrated with Nx and containerized with Docker.

### Architecture

- **apps/api**: Elysia REST API (TypeScript, Bun runtime, port 8080)
- **apps/web**: Next.js 15 frontend (TypeScript, pnpm, port 3000, App Router, Tailwind CSS v4)
- **Monorepo**: Managed by Nx workspace
- **Database**: PostgreSQL 17 (port 5432)
- **Authentication**: better-auth library used in both frontend and backend

### Key Technology Stack

- **API Runtime**: Bun (NOT Node.js) - all API commands use `bun` not `npm/node`
- **API Framework**: Elysia (latest version)
- **Web Framework**: Next.js 15.5.3 with App Router and Turbopack
- **Web Styling**: Tailwind CSS v4
- **Package Managers**:
  - Root workspace: pnpm
  - API (apps/api): bun
  - Web (apps/web): pnpm
- **Monorepo Tool**: Nx 21.5.3

## Development Commands

### Running Services Locally

```bash
# Using Nx (from root)
nx serve api          # Start API with hot reload (uses Bun)
nx serve web          # Start web with hot reload (uses pnpm)

# Direct commands
cd apps/api && bun run dev             # API dev server
cd apps/web && pnpm dev                # Web dev with Turbopack
```

<!-- ### Using Docker (Recommended)

```bash
pnpm docker:up              # Start all services (infra + apps)
pnpm docker:up:apps         # Start only API and web
pnpm docker:up:infra        # Start only database
pnpm docker:down            # Stop all services
pnpm docker:down:volumes    # Stop and remove volumes
``` -->

### Building

```bash
# Build all projects
nx run-many -t build

# Build specific project
nx build api              # Outputs to apps/api/dist
nx build web              # Outputs to apps/web/.next

# Direct build commands
cd apps/api && bun run build
cd apps/web && pnpm build
```

### Testing

```bash
# Test all projects
nx run-many -t test

# Test API (uses Bun's test runner)
nx test api
cd apps/api && bun test

# Web doesn't have test target configured yet
```

### Type Checking & Linting

```bash
# API
cd apps/api && bun run type-check

# Web
nx run web:type-check      # or cd apps/web && pnpm type-check
nx run web:lint            # or cd apps/web && pnpm lint
```

### Cleaning

```bash
# Clean API build artifacts
nx clean api              # or cd apps/api && bun run clean

# Clean Next.js cache
rm -rf apps/web/.next
```

## Important Architectural Details

### Frontend: Separation of Concerns (CRITICAL)

**All frontend code MUST strictly separate business logic from components and views.**

This is a non-negotiable architectural principle that applies to ALL code generation and modifications in `apps/web/`.

#### Structure Requirements

```
apps/web/
├── app/              # Pages (views) - coordinate data and components only
├── components/       # React components - presentation ONLY
├── lib/              # Business logic - ALL logic goes here
│   ├── services/     # API calls, data fetching, external integrations
│   ├── hooks/        # Custom hooks containing business logic
│   ├── utils/        # Pure utility functions and data transformations
│   └── types/        # TypeScript types and interfaces
```

#### Enforcement Rules

1. **Components** (`components/`):
   - Only presentational logic (rendering, conditional display)
   - Accept all data via props
   - Use callbacks for user interactions
   - No API calls, no data fetching, no complex transformations
   - No `fetch`, no `axios`, no database operations

2. **Business Logic** (`lib/`):
   - API calls live in `lib/services/`
   - Reusable stateful logic in `lib/hooks/`
   - Data transformations in `lib/utils/`
   - Type definitions in `lib/types/`

3. **Pages** (`app/`):
   - Server Components: fetch data directly or call services
   - Client Components: use custom hooks from `lib/hooks/`
   - Compose components and pass data down
   - Handle routing, layouts, and page-level concerns

#### Code Generation Guidelines

When generating new code:
- **NEVER** put `fetch()`, `axios`, or API calls directly in components
- **ALWAYS** create a service in `lib/services/` for API interactions
- **ALWAYS** create custom hooks in `lib/hooks/` for complex stateful logic
- **ALWAYS** keep components focused on presentation only

Example violation (DO NOT generate):
```tsx
// ❌ WRONG - Logic in component
export function UserList() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers);
  }, []);
  return <div>{users.map(u => <div>{u.name}</div>)}</div>;
}
```

Correct implementation (ALWAYS generate this way):
```tsx
// ✅ CORRECT - Separated concerns

// lib/services/users.ts
export async function fetchUsers() {
  const response = await fetch('/api/users');
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

// lib/hooks/use-users.ts
export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  return { users, loading };
}

// components/user-list.tsx
export function UserList({ users }: { users: User[] }) {
  return <div>{users.map(u => <div key={u.id}>{u.name}</div>)}</div>;
}

// app/users/page.tsx
'use client';
import { useUsers } from '@/lib/hooks/use-users';
import { UserList } from '@/components/user-list';

export default function UsersPage() {
  const { users, loading } = useUsers();
  if (loading) return <div>Loading...</div>;
  return <UserList users={users} />;
}
```

### Backend: Separation of Concerns (CRITICAL)

**All backend code MUST strictly separate routes, services, and configuration.**

This architectural principle applies to ALL code generation and modifications in `apps/api/`.

#### Structure Requirements

```
apps/api/src/
├── index.ts          # Main entry point - only app initialization and route mounting
├── config/           # Configuration and environment variables
│   └── env.ts        # Centralized config management
├── utils/            # Shared utilities (parsers, helpers)
│   └── duration.ts   # Pure utility functions
├── services/         # Business logic layer
│   ├── youtube.service.ts   # YouTube API interactions
│   ├── rss.service.ts       # RSS feed parsing
│   └── db.service.ts        # Database operations
├── routes/           # API endpoints organized by resource
│   ├── auth.routes.ts
│   ├── game.routes.ts
│   └── health.routes.ts
├── lib/              # Existing infrastructure (auth, middleware)
└── db/               # Database schema and connection
```

#### Enforcement Rules

1. **Routes** (`routes/`):
   - Define endpoints and handle HTTP concerns only
   - Validate request parameters
   - Call service functions for business logic
   - Format responses
   - No direct database queries, no business logic
   - Use Elysia `prefix` option for consistent route organization

2. **Services** (`services/`):
   - Contain all business logic
   - Handle external API calls (YouTube, RSS)
   - Perform database operations
   - Implement data transformations
   - Return structured data
   - Services should be stateless and testable

3. **Config** (`config/`):
   - Environment variable parsing
   - Application configuration
   - Type-safe config exports
   - No business logic

4. **Utils** (`utils/`):
   - Pure functions only
   - No side effects
   - Reusable across the application

#### Code Generation Guidelines

When generating new backend code:
- **NEVER** put database queries directly in route handlers
- **NEVER** put external API calls in route handlers
- **ALWAYS** create service functions for business logic
- **ALWAYS** organize routes by resource in separate files
- **ALWAYS** use the service layer for database operations

Example violation (DO NOT generate):
```tsx
// ❌ WRONG - Business logic in route handler
.get('/api/users', async (context) => {
  const users = await db.select().from(user).where(eq(user.active, true));
  const enriched = await Promise.all(users.map(async u => {
    const posts = await db.select().from(post).where(eq(post.userId, u.id));
    return { ...u, postCount: posts.length };
  }));
  return { users: enriched };
})
```

Correct implementation (ALWAYS generate this way):
```tsx
// ✅ CORRECT - Separated concerns

// services/user.service.ts
export async function getActiveUsers() {
  return await db.select().from(user).where(eq(user.active, true));
}

export async function enrichUserWithPostCount(userId: string) {
  const posts = await db.select().from(post).where(eq(post.userId, userId));
  return posts.length;
}

export async function getActiveUsersWithPosts() {
  const users = await getActiveUsers();
  const enriched = await Promise.all(users.map(async u => ({
    ...u,
    postCount: await enrichUserWithPostCount(u.id)
  })));
  return enriched;
}

// routes/users.routes.ts
import { Elysia } from 'elysia';
import { getActiveUsersWithPosts } from '../services/user.service';

export const usersRoutes = new Elysia({ prefix: '/api/users' })
  .get('/', async () => {
    const users = await getActiveUsersWithPosts();
    return { users };
  });

// index.ts
import { usersRoutes } from './routes/users.routes';

const app = new Elysia()
  .use(usersRoutes)
  .listen(8080);
```

### CORS Configuration

The API dynamically configures CORS origins based on environment variables:
- Default origins: `http://localhost:3000`, `http://127.0.0.1:3000`, `http://web:3000` (Docker)
- Override with `CORS_ALLOWED_ORIGINS` env var (comma-separated)
- See `apps/api/src/config/env.ts` for implementation

### Health Check System

The project has a comprehensive health monitoring system:
- API endpoint: `GET /health` returns service status, version, runtime info, CORS config
- API actuator: `GET /actuator/health` provides detailed health info
- Web health dashboard: `http://localhost:3000/health` displays live API status

### Docker Development Environment

- Volume mounts enable hot reload for both API and web
- Services communicate via Docker network (`gaeldle-network`)
- Database has health checks ensuring dependent services wait for DB
- Named volumes for node_modules improve performance
- API waits for DB to be healthy before starting

### Nx Workspace Configuration

- Default base branch: `main`
- Build caching enabled for `build`, `test`, and `lint` targets
- Build targets have dependency chain: web depends on API builds (`^build`)
- Workspace layout: apps in `apps/`, libs in `libs/`

### Port Configuration

Default ports (overridable via environment variables):
- API: 8080 (`PORT` or `SERVER_PORT`)
- Web: 3000 (`CLIENT_PORT`)
- PostgreSQL: 5432 (`DB_PORT`)

### Environment Variables

**API (apps/api):**
- `PORT` or `SERVER_PORT`: API port (default: 8080)
- `CLIENT_PORT`: Frontend port for CORS (default: 3000)
- `CORS_ALLOWED_ORIGINS`: Comma-separated CORS origins
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment (development/production)

**Web (apps/web):**
- `NEXT_PUBLIC_SERVER_URL`: Public API URL for client-side
- `SERVER_URL`: API URL for server-side
- `CLIENT_PORT`: Dev server port (default: 3000)

**Docker (docker-compose.yml):**
- `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `DB_PORT`
- `SERVER_PORT`, `CLIENT_PORT`

## Project-Specific Notes

- **Bun for API**: The API uses Bun runtime exclusively. Always use `bun` commands, never `npm` or `node`
- **Nx Project Names**: Use `api` and `web` (not @gaeldle/api or @gaeldle/web) in Nx commands
- **Turbopack**: Next.js dev and build commands use `--turbopack` flag for faster builds
- **Commitlint**: Conventional commits enforced (`feat:`, `fix:`, `docs:`, `chore:`, etc.)
- **Database**: PostgreSQL 17 configured but API indicates "Not configured yet" in health endpoint
- **better-auth**: Authentication library present in both apps but not fully integrated yet

## Common Development Tasks

When adding new API endpoints:
1. Create or update service functions in `apps/api/src/services/` for business logic
2. Create or update route file in `apps/api/src/routes/` (e.g., `users.routes.ts`)
3. Import and mount the route in `apps/api/src/index.ts` using `.use()`
4. Test with `curl http://localhost:8080/your-endpoint`
5. Consider CORS implications for frontend access

When adding new web pages:
1. Add page components in `apps/web/app/*/page.tsx`
2. Create service functions in `apps/web/lib/services/` for API calls
3. Create custom hooks in `apps/web/lib/hooks/` for stateful logic
4. Keep components in `apps/web/components/` presentational only
5. Use App Router conventions (server components by default)
6. Environment variables for API URLs: use `NEXT_PUBLIC_SERVER_URL` for client-side, `SERVER_URL` for server-side

When working with Docker:
1. Source code changes auto-reload (volume mounts)
2. Package changes require container rebuild
3. Check logs: `docker compose logs -f [api|web|db]`
