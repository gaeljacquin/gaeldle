import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { GamesService } from './games.service';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}
  @Get()
  findAll() {
    return this.gamesService.findAll();
  }

  @Get('/random/:modeId')
  findOneRandom(@Param('modeId', ParseIntPipe) modeId: number) {
    return this.gamesService.findOneRandom(modeId);
  }
}
