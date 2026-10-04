import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { DatabaseModule } from '@/db/database.module';
import { GamesModule } from '@/games/games.module';
import { DiscoverRouter } from '@/discover/discover.router';
import { DiscoverService } from '@/discover/discover.service';

@Module({
  imports: [DatabaseModule, AuthModule, GamesModule],
  controllers: [DiscoverRouter],
  providers: [DiscoverService],
})
export class DiscoverModule {}
