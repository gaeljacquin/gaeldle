import { Module } from '@nestjs/common';
import { GotdService } from './gotd.service';
import { GotdController } from './gotd.controller';
import { PrismaService } from '~/src/prisma/prisma.service';
import { RedisService } from '~/src/redis/redis.service';
import { RedisRepository } from '~/src/redis/redis.repository';
import { RedisClientFactory } from '~/src/redis/redis-client.factory';

@Module({
  controllers: [GotdController],
  providers: [
    GotdService,
    PrismaService,
    RedisService,
    RedisRepository,
    RedisClientFactory,
  ],
})
export class GotdModule {}
