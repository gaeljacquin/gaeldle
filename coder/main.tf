terraform {
  required_providers {
    coder = {
      source  = "coder/coder"
      version = "~> 0.20"
    }
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

provider "coder" {}
provider "docker" {}

data "coder_workspace" "me" {}
data "coder_workspace_owner" "me" {}

resource "docker_volume" "home" {
  name = "coder-${data.coder_workspace_owner.me.name}-${data.coder_workspace.me.name}-home"
}

resource "docker_image" "dev" {
  name         = var.base_image
  keep_locally = true
}

resource "coder_agent" "main" {
  os   = "linux"
  arch = "amd64"

  # IMPORTANT: do NOT set GIT_SSH_COMMAND here, Coder uses it to inject your SSH key.
  env = {
    HOME = "/root"
  }

  startup_script = <<-EOT
    set -eu

    # Ensure base tools exist (node image is slim)
    # if ! command -v git >/dev/null 2>&1; then
    #   export DEBIAN_FRONTEND=noninteractive
    #   apt-get update -y
    #   apt-get install -y --no-install-recommends git openssh-client ca-certificates curl
    #   update-ca-certificates || true
    # fi

    # Preserve Coder's injected GIT_SSH_COMMAND (contains IdentityFile),
    # but auto-accept host keys on first connect.
    if [ -n "$${GIT_SSH_COMMAND:-}" ]; then
      export GIT_SSH_COMMAND="$${GIT_SSH_COMMAND} -o StrictHostKeyChecking=accept-new"
    else
      export GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=accept-new"
    fi

    # Clone or fix remote
    if [ -d "$HOME/${var.app_dir}/.git" ]; then
      git -C "$HOME/${var.app_dir}" remote set-url origin "${var.repo_url}" || true
    else
      rm -rf "$HOME/${var.app_dir}"
      git clone "${var.repo_url}" "$HOME/${var.app_dir}"
    fi

    cd "$HOME/${var.app_dir}"

    # Corepack/pnpm without global installs (avoids yarnpkg EEXIST issues)
    npx -y corepack@latest enable
    npx -y corepack@latest prepare pnpm@latest --activate

    # Install deps using corepack pnpm (avoid PATH/shim timing issues)
    npx -y corepack@latest pnpm install

    # Shared env (matches your env examples)
    export NEXT_PUBLIC_SERVER_URL="http://localhost:${var.api_port}"
    export SERVER_URL="http://localhost:${var.api_port}"
    export CLIENT_PORT="${var.web_port}"
    export CORS_ALLOWED_ORIGINS="${var.cors_allowed_origins}"
    export TRUSTED_ORIGINS="${var.trusted_origins}"

    # Secrets / config
    export DATABASE_URL="${var.database_url}"
    export BETTER_AUTH_SECRET="${var.better_auth_secret}"
    export GOOGLE_CLIENT_ID="${var.google_client_id}"
    export GOOGLE_CLIENT_SECRET="${var.google_client_secret}"
    export NEO4J_URI="${var.neo4j_uri}"
    export NEO4J_USER="${var.neo4j_user}"
    export NEO4J_PASSWORD="${var.neo4j_password}"

    # Per-app ports & per-app BETTER_AUTH_URL
    (
      export PORT="${var.web_port}"
      export BETTER_AUTH_URL="${var.better_auth_url_web}"
      nohup npx -y corepack@latest pnpm nx run web:serve -- --hostname 0.0.0.0 --port "${var.web_port}" >"$HOME/web.log" 2>&1 &
    )

    (
      export PORT="${var.api_port}"
      export BETTER_AUTH_URL="${var.better_auth_url_api}"
      nohup npx -y corepack@latest pnpm nx run api:serve -- --host=0.0.0.0 --port="${var.api_port}" >"$HOME/api.log" 2>&1 &
    )

    echo "Started web on :${var.web_port} (log: $HOME/web.log)"
    echo "Started api on :${var.api_port} (log: $HOME/api.log)"
    echo "Startup end: $(date -Iseconds)"
  EOT
}

resource "docker_container" "workspace" {
  image = docker_image.dev.image_id
  name  = "coder-${data.coder_workspace_owner.me.name}-${data.coder_workspace.me.name}"

  env = [
    "CODER_AGENT_TOKEN=${coder_agent.main.token}",
    "HOME=/root",
  ]

  entrypoint   = ["/bin/sh", "-c", coder_agent.main.init_script]
  hostname     = data.coder_workspace.me.name
  user         = "root"
  working_dir  = "/root"

  volumes {
    container_path = "/root"
    volume_name    = docker_volume.home.name
  }
}

resource "coder_app" "web" {
  agent_id     = coder_agent.main.id
  slug         = "web"
  display_name = "Web"
  url          = "http://localhost:${var.web_port}"
  subdomain    = true

  healthcheck {
    url       = "http://localhost:${var.web_port}"
    interval  = 5
    threshold = 20
  }
}

resource "coder_app" "api" {
  agent_id     = coder_agent.main.id
  slug         = "api"
  display_name = "API"
  url          = "http://localhost:${var.api_port}"
  subdomain    = true

  healthcheck {
    url       = "http://localhost:${var.api_port}"
    interval  = 5
    threshold = 20
  }
}
