import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { DatabaseModule } from '@/db/database.module';
import { GamesRouter } from '@/games/games.router';
import { GamesService } from '@/games/games.service';
import { IgdbService } from '@/games/igdb.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [GamesRouter],
  providers: [GamesService, IgdbService],
})
export class GamesModule {}
