import { Module } from '@nestjs/common';
import { ModesController } from './modes.controller';
import { ModesService } from './modes.service';
import { PrismaService } from '~/src/prisma/prisma.service';
import { RedisService } from '~/src/redis/redis.service';
import { RedisRepository } from '~/src/redis/redis.repository';
import { RedisClientFactory } from '~/src/redis/redis-client.factory';

@Module({
  controllers: [ModesController],
  providers: [
    ModesService,
    PrismaService,
    RedisService,
    RedisRepository,
    RedisClientFactory,
  ],
})
export class ModesModule {}
