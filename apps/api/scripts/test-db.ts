import { config } from 'dotenv';
import { Pool } from 'pg';

config({ path: './apps/api/.env' });

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

try {
  const result = await pool.query<{ total: string; missing: string }>(
    'SELECT COUNT(*) as total, COUNT(CASE WHEN ai_image_url IS NULL THEN 1 END) as missing FROM game;',
  );
  console.log('Database Status:');
  console.log('Total games:', result.rows[0].total);
  console.log('Games with missing ai_image_url:', result.rows[0].missing);
  await pool.end();
} catch (error) {
  console.error('Connection failed:', error);
  process.exit(1);
}
