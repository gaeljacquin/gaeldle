# Development Commands

## Running Services Locally

```bash
# Using Turbo (from root)
turbo dev
# or
bun run dev

# Specific projects
turbo dev --filter @gaeldle/web
turbo dev --filter games-api

# Direct commands
cd apps/api && bun run dev
cd apps/web && bun run dev
```

## Building

```bash
# Build all projects
turbo build
# or
bun run build

# Build specific project
turbo build --filter games-api
turbo build --filter @gaeldle/web

# Direct build commands
cd apps/api && bun run build
cd apps/web && bun run build
```

## Testing

```bash
# Test all projects
turbo test
# or
bun run test

# Test API
turbo test --filter games-api
cd apps/api && bun test
```

## Type Checking & Linting

```bash
# All projects
turbo type-check
turbo lint

# API
cd apps/api && bun run type-check

# Web
cd apps/web && bun run type-check
cd apps/web && bun run lint
```

## Cleaning

```bash
# Clean build artifacts
rm -rf .turbo apps/api/dist apps/web/.next
```
