# Scatterbush

A modern monorepo featuring an Elysia backend and Next.js frontend, orchestrated with Nx and containerized with Docker.

## 🏗️ Architecture

```
scatterbush/
├── apps/
│   ├── api/          # Elysia REST API (TypeScript, Bun, Port 8080)
│   └── web/          # Next.js Frontend (TypeScript, pnpm, Port 3000)
├── docker-compose.yml # Multi-service development environment
├── nx.json           # Nx workspace configuration
└── package.json      # Root workspace configuration
```

## 📐 Architecture Principles

### Frontend: Separation of Concerns

**Business logic MUST be separated from components and views.**

This architectural principle ensures maintainability, testability, and reusability across the frontend codebase.

#### Structure Guidelines

```
apps/web/
├── app/              # Next.js App Router pages (views only)
├── components/       # React components (presentation only)
├── lib/              # Business logic, utilities, and services
│   ├── services/     # API calls, data fetching
│   ├── hooks/        # Custom hooks with business logic
│   ├── utils/        # Pure utility functions
│   └── types/        # TypeScript types and interfaces
```

#### Key Rules

1. **Components**: Focus solely on presentation and user interaction
   - Accept data via props
   - Emit events/callbacks for user actions
   - Minimal logic (formatting, conditional rendering only)

2. **Business Logic**: Lives in separate modules
   - API calls in `lib/services/`
   - Reusable logic in custom hooks (`lib/hooks/`)
   - Data transformations in `lib/utils/`
   - Type definitions in `lib/types/`

3. **Pages**: Coordinate components and business logic
   - Fetch data (Server Components) or use hooks (Client Components)
   - Pass data to presentational components
   - Handle routing and layout

#### Example

**❌ Bad - Logic mixed with presentation:**
```tsx
// app/users/page.tsx
export default function UsersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(setUsers);
  }, []);

  return <div>{users.map(u => <UserCard user={u} />)}</div>;
}
```

**✅ Good - Separated concerns:**
```tsx
// lib/services/users.ts
export async function fetchUsers() {
  const response = await fetch('/api/users');
  return response.json();
}

// lib/hooks/use-users.ts
export function useUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers().then(setUsers);
  }, []);

  return users;
}

// app/users/page.tsx
import { useUsers } from '@/lib/hooks/use-users';

export default function UsersPage() {
  const users = useUsers();
  return <div>{users.map(u => <UserCard user={u} />)}</div>;
}
```

**This principle applies to all new code generation and modifications.**

### Backend: Separation of Concerns

**Business logic MUST be separated from routes and configuration.**

This architectural principle ensures the backend API is maintainable, testable, and scalable.

#### Structure Guidelines

```
apps/api/src/
├── index.ts          # Main entry point - app initialization only
├── config/           # Configuration and environment variables
│   └── env.ts        # Centralized config management
├── utils/            # Shared utilities (pure functions)
│   └── duration.ts   # Helper functions
├── services/         # Business logic layer
│   ├── youtube.service.ts   # YouTube API interactions
│   ├── rss.service.ts       # RSS feed parsing
│   └── db.service.ts        # Database operations
├── routes/           # API endpoints by resource
│   ├── auth.routes.ts
│   ├── channels.routes.ts
│   ├── videos.routes.ts
│   ├── subscriptions.routes.ts
│   ├── feed.routes.ts
│   ├── search.routes.ts
│   ├── history.routes.ts
│   ├── playlists.routes.ts
│   ├── recommended.routes.ts
│   ├── sse.routes.ts
│   └── health.routes.ts
├── lib/              # Infrastructure (auth, middleware)
└── db/               # Database schema and connection
```

#### Key Rules

1. **Routes**: Handle HTTP concerns only
   - Validate request parameters
   - Call service functions
   - Format responses
   - No business logic, no database queries

2. **Services**: Contain all business logic
   - External API calls (YouTube, RSS)
   - Database operations
   - Data transformations
   - Stateless and testable

3. **Config**: Environment and configuration
   - Type-safe exports
   - No business logic

4. **Utils**: Pure functions only
   - No side effects
   - Reusable helpers

#### Example

**❌ Bad - Logic in route handler:**
```tsx
.get('/api/users', async (context) => {
  const users = await db.select().from(user).where(eq(user.active, true));
  const enriched = await Promise.all(users.map(async u => {
    const posts = await db.select().from(post).where(eq(post.userId, u.id));
    return { ...u, postCount: posts.length };
  }));
  return { users: enriched };
})
```

**✅ Good - Separated concerns:**
```tsx
// services/user.service.ts
export async function getActiveUsersWithPosts() {
  const users = await db.select().from(user).where(eq(user.active, true));
  return await Promise.all(users.map(async u => ({
    ...u,
    postCount: await getPostCount(u.id)
  })));
}

// routes/users.routes.ts
import { Elysia } from 'elysia';
import { getActiveUsersWithPosts } from '../services/user.service';

export const usersRoutes = new Elysia({ prefix: '/api/users' })
  .get('/', async () => {
    const users = await getActiveUsersWithPosts();
    return { users };
  });
```

**This principle applies to all new code generation and modifications.**

## 🚀 Quick Start

### Prerequisites

- **Bun** (JavaScript runtime and package manager)
- **Node.js 24**
- **pnpm** (package manager)
- **Docker & Docker Compose**
- **Git**

### Development Setup

1. **Clone and setup**
   ```bash
   git clone <your-repo>
   cd scatterbush
   pnpm install
   ```

2. **Start services**
   ```bash
   # Option 1: Using Docker (Recommended)
   pnpm run docker:up

   # Option 2: Local development
   # Terminal 1 - API
   nx serve api
   
   # Terminal 2 - Web
   nx serve web
   ```

3. **Access applications**
   - Frontend: http://localhost:3000
   - API Health: http://localhost:8080/health
   - API Actuator: http://localhost:8080/actuator/health

## 📊 Health Check Endpoints

### Elysia API (`/health`)

The API provides a comprehensive health check endpoint:

```bash
curl http://localhost:8080/health
```

**Response:**
```json
{
  "status": "UP",
  "service": "scatterbush-api", 
  "version": "1.0.0",
  "timestamp": "2025-09-22T21:46:35",
  "port": 8080,
  "allowedOrigins": "http://localhost:3000,http://web:3000",
  "details": {
    "database": "Not configured yet",
    "bunVersion": "1.0.0",
    "elysiaVersion": "1.0.0"
  }
}
```

### API Health Monitoring (`/actuator/health`)

Additional monitoring capabilities via health endpoints:

```bash
curl http://localhost:8080/actuator/health
```

The actuator provides detailed health information including:
- Disk space status
- Database connectivity (when configured)
- Custom health indicators

### Frontend Health Page

Visit http://localhost:3000/health to see a visual health dashboard that:
- Fetches live data from the API health endpoint
- Displays connection status and troubleshooting info
- Shows detailed system information
- Provides refresh functionality

## 🛠️ Development Commands

### Nx Commands
```bash
# List all projects
nx show projects

# Run specific project
nx serve api
nx serve web

# Build all projects  
nx run-many -t build

# Test all projects
nx run-many -t test

# Run API specific commands
nx build api
nx test api
```

### Docker Commands
```bash
# Start all services (apps + infrastructure)
pnpm run docker:up

# Start only applications
pnpm run docker:up:apps

# Start only infrastructure (database, etc.)
pnpm run docker:up:infra

# Stop all services
pnpm run docker:down

# Stop and remove volumes
pnpm run docker:down:volumes
```

### Elysia API Commands
```bash
cd apps/api

# Run locally
bun run dev

# Build
bun run build

# Test
bun test
```

### Next.js Frontend Commands
```bash
cd apps/web

# Development
pnpm dev

# Build
pnpm build

# Type checking
pnpm type-check

# Lint
pnpm lint
```

## 🐳 Docker Configuration

### Services

- **postgres**: PostgreSQL 17 database (port 5432)
- **api**: Elysia application (port 8080)
- **web**: Next.js application (port 3000)

### Profiles

- `infra`: Infrastructure services only
- `apps`: Application services only  
- `all`: Everything (default)

### Development Features

- **Hot reload**: Source code changes trigger automatic rebuilds
- **Volume mounts**: Real-time code synchronization
- **Network isolation**: Services communicate via Docker network
- **Health checks**: Automated service health monitoring

## 🔧 Technology Stack

### Backend (API)
- **Framework**: Elysia 1.0+
- **Runtime**: Bun
- **Language**: TypeScript
- **Features**:
  - REST API endpoints
  - Built-in health monitoring
  - CORS configuration
  - Type-safe endpoints

### Frontend (Web)  
- **Framework**: Next.js 15.3+ w/ App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Package Manager**: pnpm
- **Features**:
  - Server-side rendering
  - API integration
  - Health status dashboard
  - Responsive design

### Development Tools
- **Monorepo**: Nx 21.5.3
- **Containerization**: Docker & Docker Compose
- **Version Control**: Git
- **Code Quality**: Commitlint, ESLint
- **Database**: PostgreSQL 17

## 📡 API Documentation

### Health Endpoint
- **URL**: `GET /health`
- **Port**: 8080
- **Description**: Custom health check with system information

### Health Monitoring Endpoints
- **Base URL**: `/actuator`
- **Available endpoints**:
  - `/actuator/health` - Detailed health information
  - `/health` - Custom health check

### CORS Configuration
The API is configured to accept requests from:
- `http://localhost:3000` (Frontend development)
- Configurable via environment variables

## 🚦 Testing

### Postman Testing
1. Import the API endpoints
2. Test health endpoint: `GET http://localhost:8080/health`
3. Test actuator endpoint: `GET http://localhost:8080/actuator/health`

### Frontend Testing
1. Visit: http://localhost:3000
2. Navigate to: http://localhost:3000/health
3. Verify API connectivity and data display

### End-to-End Testing
1. Start all services: `pnpm docker:up`
2. Wait for services to be healthy
3. Test API: `curl http://localhost:8080/health`
4. Test Frontend: Open http://localhost:3000/health
5. Verify data flows between services

## 🔍 Troubleshooting

### Common Issues

#### API not starting
- Check Bun version: `bun --version`
- Verify port 8080 is available: `lsof -i :8080`
- Check TypeScript compilation: `bun run build`

#### Frontend build issues
- Clear Next.js cache: `rm -rf apps/web/.next`
- Reinstall dependencies: `cd apps/web && pnpm install`
- Check Node version: `node --version`

#### Docker issues
- Check Docker daemon: `docker ps`
- View service logs: `docker compose logs <service-name>`
- Restart services: `pnpm run docker:down && pnpm run docker:up`

#### CORS errors
- Verify API CORS configuration
- Check environment variables
- Ensure frontend runs on port 3000

### Logs and Monitoring

```bash
# View all service logs
docker compose logs -f

# View specific service logs  
docker compose logs -f api
docker compose logs -f web

# View Nx workspace info
nx show projects
nx graph
```

## 🚢 Deployment

### Production Build
```bash
# Build all applications
nx run-many -t build

# Build API
cd apps/api && bun run build

# Build Next.js static files
cd apps/web && pnpm build
```

### Environment Variables

#### API (Elysia)
- `PORT`: Server port (default: 8080)
- `NODE_ENV`: Environment (development/production)
- `DATABASE_URL`: Database connection
- `CORS_ALLOWED_ORIGINS`: CORS origins

#### Web (Next.js)
- `NEXT_PUBLIC_SERVER_URL`: Public API URL
- `SERVER_URL`: Server-side API URL
- `PORT`: Development server port (default: 3000)

## 🤝 Contributing

### Commit Guidelines
This project uses conventional commits:

```bash
feat: add user authentication
fix: resolve CORS issue
docs: update API documentation
chore: upgrade dependencies
```

### Development Workflow
1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit: `git commit -m "feat: add new feature"`
3. Push changes: `git push origin feature/my-feature`
4. Create pull request

### Code Quality
- Commits are validated by commitlint
- Pre-commit hooks ensure code quality
- TypeScript strict mode enabled
- ESLint configuration for consistency

## 📋 Project Commands Reference

```bash
# Workspace
pnpm install              # Install all dependencies
nx show projects          # List all projects
nx graph                  # View project graph

# Development  
nx serve api             # Start API
nx serve web             # Start web
nx run-many -t serve     # Start all services

# Build
nx build api             # Build API
nx build web             # Build web  
nx run-many -t build     # Build all

# Docker
pnpm docker:up           # Start all services
pnpm docker:down         # Stop all services
pnpm docker:up:apps      # Start only apps
pnpm docker:up:infra     # Start only infrastructure

# Testing
nx test api              # Test API
nx run-many -t test      # Test all projects
```

## 📄 License

This project is licensed under the ISC License.

---

**Happy coding! 🎉**

For questions or issues, please check the troubleshooting section or create an issue in the repository.
