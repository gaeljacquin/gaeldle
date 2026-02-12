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

    # Preserve Coder's injected GIT_SSH_COMMAND (contains IdentityFile),
    # but auto-accept host keys on first connect.
    if [ -n "$${GIT_SSH_COMMAND:-}" ]; then
      export GIT_SSH_COMMAND="$${GIT_SSH_COMMAND} -o StrictHostKeyChecking=accept-new"
    else
      export GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=accept-new"
    fi

    if ! command -v git >/dev/null 2>&1; then
      export DEBIAN_FRONTEND=noninteractive
      apt-get update -y
      apt-get install -y --no-install-recommends git openssh-client ca-certificates curl
      update-ca-certificates || true
    fi

    # Clone or fix remote
    if [ -d "$HOME/${var.app_dir}/.git" ]; then
      git -C "$HOME/${var.app_dir}" remote set-url origin "${var.repo_url}" || true
      git -C "$HOME/${var.app_dir}" fetch origin "${var.dev_branch}" || true
      git -C "$HOME/${var.app_dir}" checkout "${var.dev_branch}" || true
      git -C "$HOME/${var.app_dir}" pull --ff-only origin "${var.dev_branch}" || true
    else
      rm -rf "$HOME/${var.app_dir}"
      git clone "${var.repo_url}" "$HOME/${var.app_dir}"
    fi

    cd "$HOME/${var.app_dir}"

    # Install bun if not present
    if ! command -v bun >/dev/null 2>&1; then
      curl -fsSL https://bun.sh/install | bash
      export PATH="$HOME/.bun/bin:$PATH"
    fi

    # Install deps
    bun install

    # Create .env file from template variables
    cat > "$HOME/${var.app_dir}/apps/api/.env" <<EOF
    DATABASE_URL=${var.database_url}
    STACK_PROJECT_ID=${var.stack_project_id}
    STACK_PUBLISHABLE_CLIENT_KEY=${var.stack_publishable_client_key}
    STACK_SECRET_SERVER_KEY=${var.stack_secret_server_key}
    PORT=${var.api_port}
    CLIENT_PORT=${var.web_port}
    CORS_ALLOWED_ORIGINS=${var.cors_allowed_origins}
    OPENAI_API_KEY=${var.openai_api_key}
    TWITCH_CLIENT_ID=${var.twitch_client_id}
    TWITCH_CLIENT_SECRET=${var.twitch_client_secret}
    SUPABASE_URL=${var.supabase_url}
    SUPABASE_PUBLISHABLE_KEY=${var.supabase_publishable_key}
    SUPABASE_SECRET_KEY=${var.supabase_secret_key}
    EOF

    # If you also need one in the web app directory
    cat > "$HOME/${var.app_dir}/apps/web/.env.local" <<EOF
    SERVER_URL=${var.server_url}
    NEXT_PUBLIC_STACK_PROJECT_ID=${var.stack_project_id}
    NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=${var.stack_publishable_client_key}
    STACK_SECRET_SERVER_KEY=${var.stack_secret_server_key}
    EOF

    # Start web app
    PORT="${var.web_port}" \
    nohup bun x turbo dev --filter @gaeldle/web -- --port "${var.web_port}" >"$HOME/web.log" 2>&1 &

    # Start API
    PORT="${var.api_port}" \
    nohup bun x turbo dev --filter games-api -- --port "${var.api_port}" >"$HOME/api.log" 2>&1 &

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
