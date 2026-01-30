# Development Commands

## Running Services Locally

```bash
# Using Nx (from root)
nx serve api
nx serve web

# Direct commands
cd apps/api && bun run dev
cd apps/web && pnpm dev
```

## Building

```bash
# Build all projects
nx run-many -t build

# Build specific project
nx build api
nx build web

# Direct build commands
cd apps/api && bun run build
cd apps/web && pnpm build
```

## Testing

```bash
# Test all projects
nx run-many -t test

# Test API
nx test api
cd apps/api && bun test
```

## Type Checking & Linting

```bash
# API
cd apps/api && bun run type-check

# Web
nx run web:type-check
nx run web:lint
```

## Cleaning

```bash
# Clean API build artifacts
nx clean api
# or
cd apps/api && bun run clean

# Clean Next.js cache
rm -rf apps/web/.next
```
