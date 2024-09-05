import { Controller, Get, UseGuards } from '@nestjs/common';
import { AblyService } from './ably.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ably')
export class AblyController {
  constructor(private readonly ablyService: AblyService) {}

  @UseGuards(JwtAuthGuard)
  @Get('gen')
  async getToken() {
    return this.ablyService.generateToken();
  }
}
