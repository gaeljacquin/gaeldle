import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Body,
} from '@nestjs/common';
import { ModesService } from './modes.service';
import { jwtAuthGuard } from '~/utils/env-checks';
import { UpdateModesDto } from '~/src/modes/dto/update-modes.dto';

@jwtAuthGuard()
@Controller('modes')
export class ModesController {
  constructor(private readonly modesService: ModesService) {}
  @Get()
  findAll() {
    return this.modesService.findAll();
  }

  @Get(':modeId')
  findOne(@Param('modeId', ParseIntPipe) modeId: number) {
    return this.modesService.findOne(modeId);
  }

  @Post('edit/:modeId')
  myEdit(
    @Param('modeId', ParseIntPipe) modeId: number,
    @Body() data: UpdateModesDto,
  ) {
    return this.modesService.myEdit(modeId, data);
  }
}
