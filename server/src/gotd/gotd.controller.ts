import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { GotdService } from '~/src/gotd/gotd.service';
import { jwtAuthGuard } from '~/utils/env-checks';
import { CreateGotdDto } from '~/src/gotd/dto/create-gotd.dto';

@jwtAuthGuard()
@Controller('gotd')
export class GotdController {
  constructor(private readonly gotdService: GotdService) {}

  @Get(':modeId')
  findIt(@Param('modeId', ParseIntPipe) modeId: number) {
    return this.gotdService.findGotd(modeId);
  }

  @Post()
  create(@Body() data: CreateGotdDto) {
    return this.gotdService.create(data);
  }

  @Post('refresh/:modeId')
  updateIt(@Param('modeId', ParseIntPipe) modeId: number) {
    return this.gotdService.refreshIt(modeId);
  }

  @Get('test/:modeId')
  dbSetGotd(@Param('modeId', ParseIntPipe) modeId: number) {
    return this.gotdService.setGotd(modeId);
  }
}
