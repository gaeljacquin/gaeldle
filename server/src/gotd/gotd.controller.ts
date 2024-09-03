import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GotdService } from './gotd.service';
import { JwtAuthGuard } from '@/src/auth/jwt-auth.guard';

@Controller('gotd')
export class GotdController {
  constructor(private readonly gotdService: GotdService) {}

  @Get(':modeId')
  findIt(@Param('modeId', ParseIntPipe) modeId: number) {
    return this.gotdService.findIt(modeId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh/:modeId')
  updateIt(@Param('modeId', ParseIntPipe) modeId: number) {
    return this.gotdService.refreshIt(modeId);
  }
}
