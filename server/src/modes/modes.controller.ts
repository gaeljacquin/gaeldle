import {
  Controller,
  Get,
  // Param,
  // ParseIntPipe,
} from '@nestjs/common';
import { ModesService } from './modes.service';

@Controller('modes')
export class ModesController {
  constructor(private readonly modesService: ModesService) {}
  @Get()
  findAll() {
    return this.modesService.findAll();
  }

  // @Get(':modeId')
  // findOne(@Param('modeId', ParseIntPipe) modeId: number) {
  //   return this.modesService.findOne(modeId);
  // }
}
