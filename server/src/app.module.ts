import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GamesModule } from './games/games.module';
import { DailyStatsModule } from './daily-stats/daily-stats.module';
import { GotdModule } from './gotd/gotd.module';
import { PrismaService } from '~/src/prisma/prisma.service';
import { ModesController } from './modes/modes.controller';
import { ModesService } from './modes/modes.service';
import { ModesModule } from './modes/modes.module';
import { StatsGateway } from './stats/stats.gateway';
import { UnlimitedStatsModule } from './unlimited-stats/unlimited-stats.module';
import { DailyStatsService } from './daily-stats/daily-stats.service';
import { UnlimitedStatsService } from './unlimited-stats/unlimited-stats.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { UnlimitedGateway } from './unlimited/unlimited.gateway';
import { GamesService } from './games/games.service';

@Module({
  imports: [
    GamesModule,
    DailyStatsModule,
    UnlimitedStatsModule,
    GotdModule,
    ModesModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController, ModesController],
  providers: [
    AppService,
    PrismaService,
    ModesService,
    StatsGateway,
    DailyStatsService,
    UnlimitedStatsService,
    UnlimitedGateway,
    GamesService,
  ],
})
export class AppModule {}
