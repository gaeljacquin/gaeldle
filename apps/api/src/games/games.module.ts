import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { DatabaseModule } from 'src/db/database.module';
import { GamesController } from 'src/games/games.controller';
import { GamesService } from 'src/games/games.service';
import { IgdbService } from 'src/games/igdb.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [GamesController],
  providers: [GamesService, IgdbService],
})
export class GamesModule {}
