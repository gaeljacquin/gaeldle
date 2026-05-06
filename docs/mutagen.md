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

3. **Make the script executable**:
   ```bash
   chmod +x remote-sync.sh
   ```

## Usage

The script loads `.env` automatically if it exists — no need to source it manually.

### Via package.json (recommended):
```bash
pnpm run sync
# OR
pnpm run sync
```

### Directly:
```bash
./remote-sync.sh
```

## Default Values

If a variable is not set in `.env`, the script falls back to these defaults:

| Variable | Default |
|---|---|
| `LOCAL_PATH` | `$HOME/gaeldle` |
| `REMOTE_USER` | `<your-remote-user>` |
| `REMOTE_HOST` | `<your-remote-host>` |
| `REMOTE_PATH` | `<your-remote-path>` |

`PROJECT_NAME` is hardcoded as `gaeldle` in the script and is not configurable via `.env`.

## Management Commands

After creating the sync session, use either the `pnpm run sync:*` shorthands or raw `mutagen` commands:

| Action | pnpm shorthand | mutagen command |
|---|---|---|
| View all sessions | `pnpm run sync:list` | `mutagen sync list` |
| View all sessions (verbose) | `pnpm run sync:list-long` | `mutagen sync list --long` |
| Monitor real-time progress | `pnpm run sync:monitor` | `mutagen sync monitor gaeldle` |
| Pause syncing | `pnpm run sync:pause` | `mutagen sync pause gaeldle` |
| Resume syncing | `pnpm run sync:resume` | `mutagen sync resume gaeldle` |
| Stop and remove session | `pnpm run sync:terminate` | `mutagen sync terminate gaeldle` |
| Reset session (if issues occur) | `pnpm run sync:reset` | `mutagen sync reset gaeldle` |

## Ignored Files and Folders

The sync uses the `--ignore-vcs` flag, which automatically respects `.gitignore`. This means:

- Everything listed in `.gitignore` is excluded (e.g. `node_modules`, `dist`, `.turbo`, `*.tsbuildinfo`).
- The `.git` directory is always excluded.
- No need to manually list ignore patterns.

To exclude additional files not covered by `.gitignore`, add custom `--ignore` flags to `remote-sync.sh`.

## Troubleshooting

If sync is not working:

1. Check the SSH connection: `ssh <REMOTE_USER>@<REMOTE_HOST>`
2. Verify the remote path exists: `ssh <REMOTE_USER>@<REMOTE_HOST> "ls -la <REMOTE_PATH>"`
3. Check sync status: `pnpm run sync:list`
4. View detailed sync problems: `pnpm run sync:list-long`
5. Reset the session if needed: `pnpm run sync:reset`

Replace `<REMOTE_USER>`, `<REMOTE_HOST>`, and `<REMOTE_PATH>` with the values from your `.env` file.
