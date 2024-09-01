import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UnlimitedStatsService } from './unlimited-stats.service';

@Controller('unlimited-stats')
export class UnlimitedStatsController {
  constructor(private readonly unlimitedStatsService: UnlimitedStatsService) {}

  @Post()
  create(@Body() data) {
    return this.unlimitedStatsService.create(data);
  }

  @Get()
  findAll() {
    return this.unlimitedStatsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.unlimitedStatsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data) {
    return this.unlimitedStatsService.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.unlimitedStatsService.remove(+id);
  }
}
