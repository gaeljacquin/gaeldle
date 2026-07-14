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
