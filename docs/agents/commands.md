# Development Commands

> [!CAUTION]
> **Run all commands inside the Dev Container.**
> For security and host isolation, never run `pnpm` or `npm` commands (especially `install` or `update`) on your bare metal.

## Terminal Utilities

The Dev Container includes several productivity tools:
- **[ni](https://github.com/antfu/ni)**: Use the right package manager commands automatically (`ni`, `nr`, `nx`, `nu`, `nun`).
- **[zoxide](https://github.com/ajeetdsouza/zoxide)**: A smarter `cd` command (use `z` instead of `cd`).

## Running Services Locally

```bash
# Using Turbo (from root)
turbo dev
# or
pnpm run dev

# Specific projects
turbo dev --filter @gaeldle/web
turbo dev --filter @gaeldle/api

# Direct commands
cd apps/api && pnpm run dev
cd apps/web && pnpm run dev
```

## Building

```bash
# Build all projects
turbo build
# or
pnpm run build

# Build specific project
turbo build --filter @gaeldle/api
turbo build --filter @gaeldle/web

# Direct build commands
cd apps/api && pnpm run build
cd apps/web && pnpm run build
```

## Testing

```bash
# Test all projects
turbo test
# or
pnpm run test

# Test API
turbo test --filter @gaeldle/api
cd apps/api && pnpm test
```

## Type Checking & Linting

```bash
# All projects
turbo type-check
turbo lint

# API
cd apps/api && pnpm run type-check

# Web
cd apps/web && pnpm run type-check
cd apps/web && pnpm run lint
```

## Cleaning

```bash
# Clean build artifacts
rm -rf .turbo apps/api/dist apps/web/.next
```
