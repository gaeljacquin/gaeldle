import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { DatabaseService } from '@/db/database.service';
import { sql } from 'drizzle-orm';

@Injectable()
export class DatabaseHealthIndicator {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);

    try {
      await this.databaseService.db.execute(sql`SELECT 1`);
      return indicator.up();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return indicator.down(message);
    }
  }
}
