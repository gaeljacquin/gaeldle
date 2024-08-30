import { Module } from '@nestjs/common';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { PrismaService } from '~/src/prisma/prisma.service';
import { RedisService } from '~/src/redis/redis.service';
import { RedisRepository } from '~/src/redis/redis.repository';
import { RedisClientFactory } from '~/src/redis/redis-client.factory';

@Module({
  controllers: [StatsController],
  providers: [
    StatsService,
    PrismaService,
    RedisService,
    RedisRepository,
    RedisClientFactory,
  ],
})
export class StatsModule {}
