# Mutagen Sync Setup

Automatically sync changes in this project from your local machine to a remote LXC using Mutagen.

## Setup

1. **Install Mutagen** (if not already installed):

   ```bash
   brew install mutagen-io/mutagen/mutagen
   ```

2. **Configure environment variables**:

   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Make the scripts executable**:
   ```bash
   chmod +x start-remote-sync.sh stop-remote-sync.sh
   ```

## Usage

The script loads `.env` automatically if it exists — no need to source it manually.

### Via package.json (recommended):

```bash
nr sync
# OR
nr sync
```

### Directly:

```bash
# Start remote sync
./start-remote-sync.sh

# Stop remote sync
./stop-remote-sync.sh
```

## Default Values

If a variable is not set in `.env`, the script falls back to these defaults:

| Variable       | Default                       |
| -------------- | ----------------------------- |
| `PROJECT_NAME` | (Required in `.env`, e.g. `gaeldle`) |
| `LOCAL_PATH`   | `$HOME/$PROJECT_NAME`         |
| `REMOTE_USER`  | `demouser`                    |
| `REMOTE_HOST`  | `demohost`                    |
| `REMOTE_PATH`  | `/home/demouser/$PROJECT_NAME`|

`PROJECT_NAME` is loaded dynamically from `.env` and used to set the paths and session names.

## Management Commands

After creating the sync session, use either the `nr sync:*` shorthands or raw `mutagen` commands:

| Action                          | nr shorthand            | mutagen command/script           |
| ------------------------------- | ----------------------- | -------------------------------- |
| View all sessions               | `nr sync:list`          | `mutagen sync list`              |
| View all sessions (verbose)     | `nr sync:list-long`     | `mutagen sync list --long`       |
| Monitor real-time progress      | `nr sync:monitor`       | `mutagen sync monitor $PROJECT_NAME` |
| Pause syncing                   | `nr sync:pause`         | `mutagen sync pause $PROJECT_NAME`   |
| Resume syncing                  | `nr sync:resume`        | `mutagen sync resume $PROJECT_NAME`  |
| Stop and remove session         | `nr sync:terminate`     | `./stop-remote-sync.sh`          |
| Reset session (if issues occur) | `nr sync:reset`         | `mutagen sync reset $PROJECT_NAME`   |

## Ignored Files and Folders

The sync uses the `--ignore-vcs` flag, which automatically respects `.gitignore`. This means:

- Everything listed in `.gitignore` is excluded (e.g. `node_modules`, `dist`, `.turbo`, `*.tsbuildinfo`).
- The `.git` directory is always excluded.
- No need to manually list ignore patterns.

To exclude additional files not covered by `.gitignore`, add custom `--ignore` flags to `start-remote-sync.sh`.

## Troubleshooting

If sync is not working:

1. Check the SSH connection: `ssh <REMOTE_USER>@<REMOTE_HOST>`
2. Verify the remote path exists: `ssh <REMOTE_USER>@<REMOTE_HOST> "ls -la <REMOTE_PATH>"`
3. Check sync status: `nr sync:list`
4. View detailed sync problems: `nr sync:list-long`
5. Reset the session if needed: `nr sync:reset`

Replace `<REMOTE_USER>`, `<REMOTE_HOST>`, and `<REMOTE_PATH>` with the values from your `.env` file.
