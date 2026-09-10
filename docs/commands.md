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

Database commands target `@workspace/db` (`packages/db`):

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

## Adding Dependencies

```bash
pnpm add:web <package>   # Add to apps/web
pnpm add:api <package>   # Add to apps/api
pnpm add:db <package>    # Add to packages/db
pnpm add:ui <package>    # Add to packages/ui
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

# Specific workspace packages
turbo typecheck --filter @workspace/api
turbo typecheck --filter @workspace/web
turbo typecheck --filter @workspace/db
turbo lint --filter @workspace/web
```

## Devcontainer Environment

The devcontainer environment is pre-configured with:
- **Zsh**: Default interactive shell displaying the current working directory in the prompt.
- **Herdr**: Automatic tab and pane layout arrangement for services and commands.
- **Antigravity CLI (`agy`)**: Integrated directly in devcontainer zsh.

## Cleaning

```bash
# Clean build artifacts
rm -rf .turbo apps/api/dist apps/web/.next
```
