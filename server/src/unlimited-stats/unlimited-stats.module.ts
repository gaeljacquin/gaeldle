import { Module } from '@nestjs/common';
import { UnlimitedStatsService } from './unlimited-stats.service';
import { UnlimitedStatsController } from './unlimited-stats.controller';
import { PrismaService } from '~/src/prisma/prisma.service';

@Module({
  controllers: [UnlimitedStatsController],
  providers: [UnlimitedStatsService, PrismaService],
})
export class UnlimitedStatsModule {}
