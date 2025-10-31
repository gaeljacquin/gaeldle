#!/usr/bin/env bun
/**
 * Migration script to add full-text search column to game table
 *
 * Usage:
 *   Local:     bun run scripts/add-tsvector-search.ts
 *   Staging:   DATABASE_URL=<staging-url> bun run scripts/add-tsvector-search.ts
 *   Prod:      DATABASE_URL=<prod-url> bun run scripts/add-tsvector-search.ts
 *
 * Or set DATABASE_URL in environment before running:
 *   export DATABASE_URL=<your-connection-string>
 *   bun run scripts/add-tsvector-search.ts
 */

import 'dotenv/config';
import { Pool } from 'pg';

async function migrate() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('❌ Error: DATABASE_URL environment variable is not set');
    console.log('\nUsage:');
    console.log('  Local:     bun run scripts/add-tsvector-search.ts');
    console.log('  Staging:   DATABASE_URL=<staging-url> bun run scripts/add-tsvector-search.ts');
    console.log('  Prod:      DATABASE_URL=<prod-url> bun run scripts/add-tsvector-search.ts');
    process.exit(1);
  }

  // Extract hostname for logging (hide credentials)
  const urlObj = new URL(dbUrl);
  const hostname = urlObj.hostname;
  console.log(`\n🔄 Connecting to database: ${hostname}\n`);

  const pool = new Pool({
    connectionString: dbUrl,
  });

  try {
    console.log('Adding tsvector column for full-text search...');

    // Add the generated tsvector column
    await pool.query(`
      ALTER TABLE game
      ADD COLUMN IF NOT EXISTS name_search tsvector
      GENERATED ALWAYS AS (to_tsvector('english', name)) STORED;
    `);
    console.log('✓ Added name_search column');

    // Create GIN index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS game_name_search_idx
      ON game USING gin(name_search);
    `);
    console.log('✓ Created GIN index on name_search');

    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
