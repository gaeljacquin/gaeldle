# AGENTS.md

Gaeldle is a Turborepo monorepo with a Next.js web app and a NestJS API.

## Essentials

- Package manager: `nr` (unified for root and apps).
- Commands:
  - `nr build` (or `turbo build`)
  - `nr test` (or `turbo test`)
  - `nr typecheck` (or `turbo type-check`)
  - `nr lint` (or `turbo lint`)
  - `nr dev` (or `turbo dev`)

## Development Environment & Security

> [!IMPORTANT]
> **Hard Requirement**: All development, including package installations and updates, MUST be performed inside the Dev Container.

- **Security Isolation**: This requirement is strictly enforced to protect your host machine. npm packages can be compromised; by using a Dev Container, any malicious code remains isolated from your bare metal.
- **No Bare Metal**: Never run `ni`, `nr`, `nup`, or any package updates on your host machine. I don't want `node_modules` anywhere on the bare machine.
- **Shell Commands on Host**: If the `DEVBOX` environment variable is NOT set (meaning you are on bare metal), you MUST only run shell commands via `docker exec`.
  - Use `docker exec -i gaeldle_devcontainer-app-1 <command>` or `docker exec -i gaeldle_devcontainer-db-1 <command>` to proxy commands into the container.
  - If `docker exec` fails because Docker is not running or installed, **DO NOT** attempt to run the commands directly on the host.
- **Node Modules Management**: The project uses Docker volumes to keep `node_modules` strictly within the container.
- **Tools**: Use VS Code with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).

## More guidance

- [Architecture overview](docs/agents/architecture.md)
- [Dev commands](docs/agents/commands.md)
- [Frontend conventions (separation of concerns)](docs/agents/frontend-conventions.md)
- [Backend conventions (routes/services/config)](docs/agents/backend-conventions.md)
- [Common workflows](docs/agents/workflows.md)

## Specialized Agent Skills

The project uses Vercel's agent skills for high-quality React and design implementation. Agents should refer to these skills when working on the frontend:

- **React Best Practices**: Located in `apps/web/.agents/skills/vercel-react-best-practices`
- **Composition Patterns**: Located in `apps/web/.agents/skills/vercel-composition-patterns`
- **Web Design Guidelines**: Located in `apps/web/.agents/skills/web-design-guidelines`
