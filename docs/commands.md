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
turbo dev --filter @gaeldle/web
turbo dev --filter @gaeldle/api

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
turbo build --filter @gaeldle/api
turbo build --filter @gaeldle/web

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

# Test API
turbo test --filter @gaeldle/api
cd apps/api && nr test
```

## Type Checking & Linting

```bash
# All projects
turbo type-check
turbo lint

# API
cd apps/api && nr typecheck

# Web
cd apps/web && nr typecheck
cd apps/web && nr lint
```

## Cleaning

```bash
# Clean build artifacts
rm -rf .turbo apps/api/dist apps/web/.next
```
