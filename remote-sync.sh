#!/bin/bash

# Load .env file if it exists
if [ -f .env ]; then
  echo "Loading environment variables from .env..."
  export $(grep -v '^#' .env | xargs)
fi

# Configuration
LOCAL_PATH="${LOCAL_PATH:-$HOME/$PROJECT_NAME}"
REMOTE_USER="${REMOTE_USER:-demouser}"
REMOTE_HOST="${REMOTE_HOST:-demohost}"
REMOTE_PATH="${REMOTE_PATH:-/home/demouser/$PROJECT_NAME}"

# Derived variables
REMOTE_FULL="${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"
SYNC_NAME="${PROJECT_NAME}"

echo "Creating Mutagen sync session..."
echo "  Local:  $LOCAL_PATH"
echo "  Remote: $REMOTE_FULL"
echo "  Name:   $SYNC_NAME"
echo ""

mutagen sync create \
  "$LOCAL_PATH" \
  "$REMOTE_FULL" \
  --name "$SYNC_NAME" \
  --ignore-vcs

if [ $? -eq 0 ]; then
  echo ""
  echo "✓ Sync session '$SYNC_NAME' created successfully!"
  echo ""
  echo "Useful commands:"
  echo "  mutagen sync list                    # View all sync sessions"
  echo "  mutagen sync monitor $SYNC_NAME         # Monitor sync progress"
  echo "  mutagen sync pause $SYNC_NAME           # Pause syncing"
  echo "  mutagen sync resume $SYNC_NAME          # Resume syncing"
  echo "  mutagen sync terminate $SYNC_NAME       # Stop and remove session"
else
  echo ""
  echo "✗ Failed to create sync session"
  exit 1
fi
