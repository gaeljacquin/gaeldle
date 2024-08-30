import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GamesModule } from './games/games.module';
import { StatsModule } from './stats/stats.module';
import { GotdModule } from './gotd/gotd.module';
import { PrismaService } from '~/src/prisma/prisma.service';
import { RedisService } from '~/src/redis/redis.service';
import { RedisRepository } from '~/src/redis/redis.repository';
import { RedisClientFactory } from '~/src/redis/redis-client.factory';
import { ModesController } from './modes/modes.controller';
import { ModesService } from './modes/modes.service';
import { ModesModule } from './modes/modes.module';

@Module({
  imports: [GamesModule, StatsModule, GotdModule, ModesModule],
  controllers: [AppController, ModesController],
  providers: [
    AppService,
    PrismaService,
    RedisService,
    RedisRepository,
    RedisClientFactory,
    ModesService,
  ],
})
export class AppModule {}
