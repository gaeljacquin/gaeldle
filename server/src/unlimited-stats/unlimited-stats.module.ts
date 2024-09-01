import { Module } from '@nestjs/common';
import { UnlimitedStatsService } from './unlimited-stats.service';
import { UnlimitedStatsController } from './unlimited-stats.controller';
import { PrismaService } from '~/src/prisma/prisma.service';
import { RedisService } from '~/src/redis/redis.service';
import { RedisRepository } from '~/src/redis/redis.repository';
import { RedisClientFactory } from '~/src/redis/redis-client.factory';

@Module({
  controllers: [UnlimitedStatsController],
  providers: [
    UnlimitedStatsService,
    PrismaService,
    RedisService,
    RedisRepository,
    RedisClientFactory,
  ],
})
export class UnlimitedStatsModule {}
