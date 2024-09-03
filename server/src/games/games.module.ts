import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { ModesService } from '~/src/modes/modes.service';
import { PrismaService } from '~/src/prisma/prisma.service';

@Module({
  controllers: [GamesController],
  providers: [GamesService, ModesService, PrismaService],
})
export class GamesModule {}
