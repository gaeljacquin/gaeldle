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

  WS_ID=$(herdr workspace list 2>/dev/null | jq -r '.result.workspaces[0].workspace_id // empty' || true)

  if [ -n "$WS_ID" ]; then
    herdr workspace rename "$WS_ID" gaeldle >/dev/null 2>&1 || true
    TAB_ID=$(herdr tab list --workspace "$WS_ID" 2>/dev/null | jq -r '.result.tabs[0].tab_id // empty' || true)
    if [ -n "$TAB_ID" ]; then
      herdr tab rename "$TAB_ID" project >/dev/null 2>&1 || true
    fi
    ROOT_PANE_ID=$(herdr pane list --workspace "$WS_ID" 2>/dev/null | jq -r '.result.panes[0].pane_id // empty' || true)
    PANE_COUNT=$(herdr pane list --workspace "$WS_ID" 2>/dev/null | jq -r '.result.panes | length' 2>/dev/null || echo 0)
    if [ "$PANE_COUNT" -eq 1 ] && [ -n "$ROOT_PANE_ID" ]; then
      P2_RESP=$(herdr pane split "$ROOT_PANE_ID" --direction right --cwd /workspaces/gaeldle 2>/dev/null || true)
      P2_ID=$(echo "$P2_RESP" | jq -r '.result.pane.pane_id // empty' 2>/dev/null || true)
      if [ -n "$P2_ID" ]; then
        herdr pane split "$P2_ID" --direction down --cwd /workspaces/gaeldle >/dev/null 2>&1 || true
      fi
    fi
  else
    CREATE_RESP=$(herdr workspace create --cwd /workspaces/gaeldle --label gaeldle 2>/dev/null || true)
    TAB_ID=$(echo "$CREATE_RESP" | jq -r '.result.tab.tab_id // empty' 2>/dev/null || true)
    ROOT_PANE_ID=$(echo "$CREATE_RESP" | jq -r '.result.root_pane.pane_id // empty' 2>/dev/null || true)

    if [ -n "$TAB_ID" ]; then
      herdr tab rename "$TAB_ID" project >/dev/null 2>&1 || true
    fi

    if [ -n "$ROOT_PANE_ID" ]; then
      P2_RESP=$(herdr pane split "$ROOT_PANE_ID" --direction right --cwd /workspaces/gaeldle 2>/dev/null || true)
      P2_ID=$(echo "$P2_RESP" | jq -r '.result.pane.pane_id // empty' 2>/dev/null || true)
      if [ -n "$P2_ID" ]; then
        herdr pane split "$P2_ID" --direction down --cwd /workspaces/gaeldle >/dev/null 2>&1 || true
      fi
    fi
  fi

  herdr server stop >/dev/null 2>&1 || kill $SERVER_PID 2>/dev/null || true
  wait $SERVER_PID 2>/dev/null || true
  echo "Herdr workspace layout initialized successfully."
fi

