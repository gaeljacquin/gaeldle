#!/usr/bin/env bash
set -e
ni
nr db:migrate
nr db:refresh-all-mat-views

if command -v zoxide >/dev/null 2>&1; then
  echo "Initializing zoxide history..."

  zoxide add /workspaces/gaeldle

  for d in /workspaces/gaeldle/apps/*/ /workspaces/gaeldle/packages/*/; do
    if [ -d "$d" ]; then
      zoxide add "$d"
    fi
  done
fi

# Configure Herdr
mkdir -p ~/.config/herdr
cat <<'EOF' > ~/.config/herdr/config.toml
onboarding = false

[terminal]
default_shell = "/bin/zsh"

[ui]
agent_panel_sort = "spaces"
EOF

if command -v herdr >/dev/null 2>&1; then
  echo "Initializing Herdr workspace layout..."
  herdr server >/dev/null 2>&1 &
  SERVER_PID=$!

  # Wait for herdr server socket to be ready
  for i in {1..30}; do
    if herdr workspace list >/dev/null 2>&1; then
      break
    fi
    sleep 0.2
  done

  setup_tabs_and_panes() {
    local ws_id="$1"
    local initial_tab_id="$2"

    # Tab 1: ai (initial focused tab)
    if [ -n "$initial_tab_id" ]; then
      herdr tab rename "$initial_tab_id" ai >/dev/null 2>&1 || true
    fi

    # Tab 2: root (split right)
    local root_resp
    root_resp=$(herdr tab create --workspace "$ws_id" --label root --cwd /workspaces/gaeldle --no-focus 2>/dev/null || true)
    local p_root
    p_root=$(echo "$root_resp" | jq -r '.result.root_pane.pane_id // empty' 2>/dev/null || true)
    if [ -n "$p_root" ]; then
      herdr pane split "$p_root" --direction right --cwd /workspaces/gaeldle --no-focus >/dev/null 2>&1 || true
    fi

    # Tab 3: apps (web left, api right)
    local apps_resp
    apps_resp=$(herdr tab create --workspace "$ws_id" --label apps --cwd /workspaces/gaeldle/apps/web --no-focus 2>/dev/null || true)
    local p_web
    p_web=$(echo "$apps_resp" | jq -r '.result.root_pane.pane_id // empty' 2>/dev/null || true)
    if [ -n "$p_web" ]; then
      herdr pane split "$p_web" --direction right --cwd /workspaces/gaeldle/apps/api --no-focus >/dev/null 2>&1 || true
    fi

    # Tab 4: packages (2x2 grid: top-left api-client, top-right db, bottom-left shared, bottom-right ui)
    local pkgs_resp
    pkgs_resp=$(herdr tab create --workspace "$ws_id" --label packages --cwd /workspaces/gaeldle/packages/api-client --no-focus 2>/dev/null || true)
    local p_api_client
    p_api_client=$(echo "$pkgs_resp" | jq -r '.result.root_pane.pane_id // empty' 2>/dev/null || true)
    if [ -n "$p_api_client" ]; then
      local p_db
      p_db=$(herdr pane split "$p_api_client" --direction right --cwd /workspaces/gaeldle/packages/db --no-focus 2>/dev/null | jq -r '.result.pane.pane_id // empty' 2>/dev/null || true)
      herdr pane split "$p_api_client" --direction down --cwd /workspaces/gaeldle/packages/shared --no-focus >/dev/null 2>&1 || true
      if [ -n "$p_db" ]; then
        herdr pane split "$p_db" --direction down --cwd /workspaces/gaeldle/packages/ui --no-focus >/dev/null 2>&1 || true
      fi
    fi
  }

  WS_ID=$(herdr workspace list 2>/dev/null | jq -r '.result.workspaces[0].workspace_id // empty' || true)

  if [ -n "$WS_ID" ]; then
    herdr workspace rename "$WS_ID" gaeldle >/dev/null 2>&1 || true
    TAB_ID=$(herdr tab list --workspace "$WS_ID" 2>/dev/null | jq -r '.result.tabs[0].tab_id // empty' || true)
    setup_tabs_and_panes "$WS_ID" "$TAB_ID"
  else
    CREATE_RESP=$(herdr workspace create --cwd /workspaces/gaeldle --label gaeldle 2>/dev/null || true)
    WS_ID=$(echo "$CREATE_RESP" | jq -r '.result.workspace.workspace_id // empty' 2>/dev/null || true)
    TAB_ID=$(echo "$CREATE_RESP" | jq -r '.result.tab.tab_id // empty' 2>/dev/null || true)

    if [ -n "$WS_ID" ]; then
      setup_tabs_and_panes "$WS_ID" "$TAB_ID"
    fi
  fi

  herdr server stop >/dev/null 2>&1 || kill $SERVER_PID 2>/dev/null || true
  wait $SERVER_PID 2>/dev/null || true
  echo "Herdr workspace layout initialized successfully."
fi

