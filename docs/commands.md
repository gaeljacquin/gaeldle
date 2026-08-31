# Development Commands

## Terminal Utilities

The project environment includes productivity tools:
- **[ni](https://github.com/antfu/ni)**: Use the right package manager commands automatically (`ni`, `nr`, `nx`, `nu`, `nun`).
- **[zoxide](https://github.com/ajeetdsouza/zoxide)**: A smarter `cd` command (use `z` instead of `cd`).

## Running Services Locally

```bash
# Using Turbo (from root)
turbo dev
# or
nr dev

# Specific projects
turbo dev --filter @workspace/web
turbo dev --filter @workspace/api

# Direct commands
cd apps/api && nr dev
cd apps/web && nr dev
```

## Building

```bash
# Build all projects
turbo build
# or
nr build

# Build specific project
turbo build --filter @workspace/api
turbo build --filter @workspace/web

# Direct build commands
cd apps/api && nr build
cd apps/web && nr build
```

## OpenAPI Codegen

```bash
# Generate OpenAPI spec from NestJS controllers and update @workspace/api-client
nr codegen
# or
pnpm codegen
```

## Database (Drizzle ORM)

```bash
# Generate SQL migrations from schema
pnpm db:generate

# Apply pending migrations to PostgreSQL
pnpm db:migrate

# Push schema directly to database
pnpm db:push

# Open Drizzle Studio UI
pnpm db:studio

# Refresh all materialized views
pnpm db:refresh-all-mat-views
```

## Testing

```bash
# Test all projects
turbo test
# or
nr test

# Test Web / API specifically
turbo test --filter @workspace/web
turbo test --filter @workspace/api
```

## Type Checking & Linting

```bash
# All projects
turbo typecheck # or nr typecheck
turbo lint      # or nr lint

# API
turbo typecheck --filter @workspace/api

# Web
turbo typecheck --filter @workspace/web
turbo lint --filter @workspace/web
```

## Cleaning

```bash
# Clean build artifacts
rm -rf .turbo apps/api/dist apps/web/.next
```
