import { Module } from '@nestjs/common';
import { DailyStatsService } from './daily-stats.service';
import { DailyStatsController } from './daily-stats.controller';
import { DrizzleService, DrizzleProvider } from '~/src/drizzle/service';

@Module({
  controllers: [DailyStatsController],
  providers: [DailyStatsService, DrizzleService, DrizzleProvider],
})
export class DailyStatsModule {}
