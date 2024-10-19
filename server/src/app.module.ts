import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GamesModule } from './games/games.module';
// import { DailyStatsModule } from './daily-stats/daily-stats.module';
// import { GotdModule } from './gotd/gotd.module';
import { PrismaService } from '~/src/prisma/prisma.service';
import { ModesController } from './modes/modes.controller';
import { ModesService } from './modes/modes.service';
import { ModesModule } from './modes/modes.module';
import { UnlimitedStatsModule } from './unlimited-stats/unlimited-stats.module';
// import { DailyStatsService } from './daily-stats/daily-stats.service';
import { UnlimitedStatsService } from './unlimited-stats/unlimited-stats.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TimelineGateway } from './timeline/timeline.gateway';
import { GamesService } from './games/games.service';
// import { DailyGateway } from './daily/daily.gateway';
// import { GotdService } from './gotd/gotd.service';
import { CategoriesModule } from './categories/categories.module';
import { CategoriesService } from './categories/categories.service';
import { Timeline2Gateway } from './timeline2/timeline2.gateway';
import { CoverGateway } from './cover/cover.gateway';
import { HiloGateway } from './hilo/hilo.gateway';

@Module({
  imports: [
    GamesModule,
    // DailyStatsModule,
    UnlimitedStatsModule,
    // GotdModule,
    ModesModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
  ],
  controllers: [AppController, ModesController],
  providers: [
    AppService,
    PrismaService,
    ModesService,
    // DailyStatsService,
    UnlimitedStatsService,
    TimelineGateway,
    GamesService,
    // DailyGateway,
    // GotdService,
    CategoriesService,
    Timeline2Gateway,
    CoverGateway,
    HiloGateway,
  ],
})
export class AppModule {}
