import { Module } from '@nestjs/common';
import { DailyStatsService } from './daily-stats.service';
import { DailyStatsController } from './daily-stats.controller';
import { PrismaService } from '~/src/prisma/prisma.service';

@Module({
  controllers: [DailyStatsController],
  providers: [DailyStatsService, PrismaService],
})
export class DailyStatsModule {}
