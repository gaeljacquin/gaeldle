import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { ModesService } from '~/src/modes/modes.service';
import { DrizzleService, DrizzleProvider } from '~/src/drizzle/service';

@Module({
  controllers: [GamesController],
  providers: [GamesService, ModesService, DrizzleService, DrizzleProvider],
})
export class GamesModule {}
