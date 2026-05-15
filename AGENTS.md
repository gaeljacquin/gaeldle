# AGENTS.md

Gaeldle is a Turborepo monorepo with a Next.js web app and a NestJS API.

## Essentials

- Package manager: `pnpm` (unified for root and apps).
- Commands:
  - `pnpm run build` (or `turbo build`)
  - `pnpm run test` (or `turbo test`)
  - `pnpm run type-check` (or `turbo type-check`)
  - `pnpm run lint` (or `turbo lint`)
  - `pnpm run dev` (or `turbo dev`)

## Development Environment & Security

> [!IMPORTANT]
> **Hard Requirement**: All development, including package installations and updates, MUST be performed inside the Dev Container.

- **Security Isolation**: This requirement is strictly enforced to protect your host machine. NPM/PNPM packages can be compromised; by using a Dev Container, any malicious code remains isolated from your bare metal.
- **No Bare Metal**: Never run `pnpm install`, `npm install`, or any package updates on your host machine. I don't want `node_modules` anywhere on the bare machine.
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
