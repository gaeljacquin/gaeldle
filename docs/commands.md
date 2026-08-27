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

## Testing

```bash
# Test all projects
turbo test
# or
nr test

# Test Web
turbo test --filter @workspace/web
cd apps/web && nr test
```

## Type Checking & Linting

```bash
# All projects
turbo typecheck
turbo lint

# API
cd apps/api && nr lint

# Web
cd apps/web && nr typecheck
cd apps/web && nr lint
```

## Cleaning

```bash
# Clean build artifacts
rm -rf .turbo apps/api/api apps/web/.next
```
