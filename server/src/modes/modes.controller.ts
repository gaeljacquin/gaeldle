import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ModesService } from './modes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('modes')
export class ModesController {
  constructor(private readonly modesService: ModesService) {}
  @Get()
  findAll() {
    return this.modesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':modeId')
  findOne(@Param('modeId', ParseIntPipe) modeId: number) {
    return this.modesService.findOne(modeId);
  }
}
