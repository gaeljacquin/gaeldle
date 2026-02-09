#!/usr/bin/env node

/**
 * Preinstall script to enforce Bun as the package manager.
 * Prevents accidental use of npm or pnpm in this project.
 */

const userAgent = process.env.npm_config_user_agent || '';

if (!userAgent.includes('bun')) {
  console.error('\n');
  console.error('╔════════════════════════════════════════════════════════════════╗');
  console.error('║                                                                ║');
  console.error('║  ⚠️  This project uses Bun as its package manager.            ║');
  console.error('║                                                                ║');
  console.error('║  Please use Bun instead of npm or pnpm:                       ║');
  console.error('║                                                                ║');
  console.error('║    • Install dependencies:  bun install                        ║');
  console.error('║    • Add package:          bun add <package>                   ║');
  console.error('║    • Update packages:      bun update                          ║');
  console.error('║    • Run scripts:          bun <script-name>                   ║');
  console.error('║                                                                ║');
  console.error('║  Install Bun: https://bun.sh                                   ║');
  console.error('║                                                                ║');
  console.error('╚════════════════════════════════════════════════════════════════╝');
  console.error('\n');
  process.exit(1);
}
