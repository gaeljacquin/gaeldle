import { Injectable, Optional, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/db/schema';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  readonly db: NodePgDatabase<typeof schema>;
  private readonly pool: Pool;

  constructor(@Optional() private readonly configService?: ConfigService) {
    const databaseUrl =
      this.configService?.get<string>('databaseUrl') ||
      process.env.DATABASE_URL ||
      'postgres://postgres:postgres@localhost:5432/postgres';

    this.pool = new Pool({ connectionString: databaseUrl });
    this.db = drizzle(this.pool, { schema });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
