import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { PrismaService } from '~/src/prisma/prisma.service';
import { RedisService } from '~/src/redis/redis.service';
import { RedisRepository } from '~/src/redis/redis.repository';
import { RedisClientFactory } from '~/src/redis/redis-client.factory';

@Module({
  controllers: [GamesController],
  providers: [
    GamesService,
    PrismaService,
    RedisService,
    RedisRepository,
    RedisClientFactory,
  ],
})
export class GamesModule {}
