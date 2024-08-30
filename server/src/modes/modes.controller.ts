import { Controller, Get } from '@nestjs/common';
import { ModesService } from './modes.service';

@Controller('modes')
export class ModesController {
  constructor(private readonly modesService: ModesService) {}
  @Get()
  findAll() {
    return this.modesService.findAll();
  }
}
