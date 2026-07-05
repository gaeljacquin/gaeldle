import { Client } from 'pg';
import 'dotenv/config';

async function refreshAllMatViews() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Refreshing materialized views...');
    await client.query('CALL refresh_all_mat_views();');
    console.log('Materialized views refreshed successfully.');
  } catch (error: any) {
    if (error && error.code === '42883') {
      console.error(
        "Error: The database procedure 'refresh_all_mat_views()' does not exist.",
      );
    } else {
      console.error('Failed to refresh materialized views:', error);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

void refreshAllMatViews();
