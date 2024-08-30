import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { GotdService } from './gotd.service';

@Controller('gotd')
export class GotdController {
  constructor(private readonly gotdService: GotdService) {}

  @Get(':modeId')
  findIt(@Param('modeId', ParseIntPipe) modeId: number) {
    return this.gotdService.findIt(modeId);
  }
}
