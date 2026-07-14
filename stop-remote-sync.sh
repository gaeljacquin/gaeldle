#!/bin/bash

# Load .env file if it exists
if [ -f .env ]; then
  echo "Loading environment variables from .env..."
  while IFS= read -r line || [ -n "$line" ]; do
    # Strip leading/trailing whitespace
    line=$(echo "$line" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
    # Skip empty lines and comments
    [[ -z "$line" || "$line" =~ ^# ]] && continue
    # Export variable
    export "$line"
  done < .env
fi

# Ensure PROJECT_NAME is set
if [ -z "$PROJECT_NAME" ]; then
  echo "Error: PROJECT_NAME environment variable is not defined." >&2
  exit 1
fi

echo "Stopping Mutagen sync session '$PROJECT_NAME'..."

# Capture both stdout and stderr, and preserve the exit code
MUTAGEN_OUT=$(mutagen sync terminate "$PROJECT_NAME" 2>&1)
EXIT_CODE=$?

# Print mutagen's cleaned output
if [ -n "$MUTAGEN_OUT" ]; then
  echo "$MUTAGEN_OUT" | tr '\r' '\n' | sed -e 's/[[:space:]]*$//' | grep -v '^[[:space:]]*$'
fi

if [ $EXIT_CODE -eq 0 ]; then
  echo "✓ Sync session '$PROJECT_NAME' stopped successfully!"
else
  echo "✗ Failed to stop sync session '$PROJECT_NAME'."
  exit 1
fi
