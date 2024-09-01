import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GamesModule } from './games/games.module';
import { DailyStatsModule } from './daily-stats/daily-stats.module';
import { GotdModule } from './gotd/gotd.module';
import { PrismaService } from '~/src/prisma/prisma.service';
import { RedisService } from '~/src/redis/redis.service';
import { RedisRepository } from '~/src/redis/redis.repository';
import { RedisClientFactory } from '~/src/redis/redis-client.factory';
import { ModesController } from './modes/modes.controller';
import { ModesService } from './modes/modes.service';
import { ModesModule } from './modes/modes.module';
import { StatsGateway } from './stats/stats.gateway';
import { UnlimitedStatsModule } from './unlimited-stats/unlimited-stats.module';
import { DailyStatsService } from './daily-stats/daily-stats.service';
import { UnlimitedStatsService } from './unlimited-stats/unlimited-stats.service';

@Module({
  imports: [
    GamesModule,
    DailyStatsModule,
    UnlimitedStatsModule,
    GotdModule,
    ModesModule,
  ],
  controllers: [AppController, ModesController],
  providers: [
    AppService,
    PrismaService,
    RedisService,
    RedisRepository,
    RedisClientFactory,
    ModesService,
    StatsGateway,
    DailyStatsService,
    UnlimitedStatsService,
  ],
})
export class AppModule {}
