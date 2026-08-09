#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# 1. Load environment variables from .env files if they exist
# We do this to check for Machine Identity credentials or a Token
if [ -f "$ROOT_DIR/.env" ]; then
    set -a; source "$ROOT_DIR/.env"; set +a
fi

if [ -f .env ] && [ "$(pwd)" != "$ROOT_DIR" ]; then
    set -a; source .env; set +a
fi

# Determine Infisical domain (support INFISICAL_DOMAIN or INFISICAL_API_URL)
DOMAIN="${INFISICAL_DOMAIN:-${INFISICAL_API_URL:-https://app.infisical.com/api}}"
export INFISICAL_DOMAIN="$DOMAIN"
export INFISICAL_API_URL="$DOMAIN"

if [ -n "$INFISICAL_PROJECT_ID" ]; then
    export INFISICAL_PROJECT_ID="$INFISICAL_PROJECT_ID"
fi

# 2. Check for valid credentials
# We consider credentials valid if:
# - INFISICAL_TOKEN is set
# - OR both Client ID and Secret are set and NOT the dummy values
HAS_TOKEN=false
if [ -n "$INFISICAL_TOKEN" ]; then
    HAS_TOKEN=true
elif [ -n "$INFISICAL_CLIENT_ID" ] && [ -n "$INFISICAL_CLIENT_SECRET" ]; then
    if [ "$INFISICAL_CLIENT_ID" != "00000000-0000-0000-0000-000000000000" ] && [ "$INFISICAL_CLIENT_SECRET" != "placeholder_replace_me" ]; then
        HAS_TOKEN=true
        # Exchange Client ID/Secret for a token
        TOKEN=$(infisical login --method=universal-auth \
            --client-id="$INFISICAL_CLIENT_ID" \
            --client-secret="$INFISICAL_CLIENT_SECRET" \
            --domain="$DOMAIN" \
            --silent --plain 2>/dev/null)
        if [ $? -eq 0 ] && [ -n "$TOKEN" ]; then
            export INFISICAL_TOKEN="$TOKEN"
        else
            HAS_TOKEN=false
        fi
    fi
fi

# 3. Execute Infisical OR fail silently to allow local fallback
if [ "$HAS_TOKEN" = true ]; then
    export INFISICAL_DISABLE_KEYRING=true
    export INFISICAL_DISABLE_UPDATE_CHECK=true
    exec infisical "$@"
else
    # No valid credentials found.
    # Exit with 1 so that the '||' in package.json triggers the fallback command.
    exit 1
fi
