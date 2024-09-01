import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { DailyStatsService } from './daily-stats.service';

@Controller('daily-stats')
export class DailyStatsController {
  constructor(private readonly dailyStatsService: DailyStatsService) {}

  @Post()
  create(@Body() data) {
    return this.dailyStatsService.create(data);
  }

  @Get()
  findAll() {
    return this.dailyStatsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dailyStatsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data) {
    return this.dailyStatsService.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dailyStatsService.remove(+id);
  }
}
