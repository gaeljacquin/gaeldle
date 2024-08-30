import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Post()
  create(@Body() data) {
    return this.statsService.create(data);
  }

  @Get()
  findAll() {
    return this.statsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.statsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data) {
    return this.statsService.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.statsService.remove(+id);
  }
}
