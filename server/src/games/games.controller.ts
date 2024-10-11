import { Controller, Get } from '@nestjs/common';
import { GamesService } from './games.service';
import { jwtAuthGuard } from '~/utils/env-checks';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}
  @Get()
  findAll() {
    return this.gamesService.findAll();
  }

  @jwtAuthGuard()
  @Get('/test')
  findTest() {
    return this.gamesService.findRandom(10, 15);
  }
}
