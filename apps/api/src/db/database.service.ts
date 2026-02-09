import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  readonly db: NodePgDatabase<typeof schema>;
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = this.configService.get<string>('databaseUrl');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required');
    }

    this.pool = new Pool({ connectionString: databaseUrl });
    this.db = drizzle(this.pool, { schema });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
