# Coder Template (Docker)

This template provisions a Docker-based Coder workspace for this repo, clones it via SSH, and installs dependencies.

## What it does
- Uses the latest Node image: `node:current`
- Clones `gaeldle` with SSH
- Enables Corepack and installs deps with pnpm
- Exposes two apps in Coder: Web (`3000`) and API (`8080`)

## Setup
1) In Coder UI, create a new template and point it at the `coder/` folder.
2) Ensure your Coder user has an SSH key configured that can access Gitea.
3) Create a workspace from the template.

## After the workspace starts
Run the dev servers:

```sh
bun dev
```

## Variables
Override these in the template settings if needed:
- `base_image`
- `repo_url`
- `web_port`
- `api_port`
