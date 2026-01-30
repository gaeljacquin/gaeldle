# Docker Workflow

If using Docker Compose, typical commands are:

```bash
pnpm docker:up
pnpm docker:up:apps
pnpm docker:up:infra
pnpm docker:down
pnpm docker:down:volumes
```

Notes:

- Source changes hot-reload via volume mounts.
- Dependency changes require container rebuild.
- Logs: `docker compose logs -f [api|web|db]`.
