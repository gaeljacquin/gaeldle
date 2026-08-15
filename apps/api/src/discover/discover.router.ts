import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import type { Request } from 'express';
import type { JWTPayload } from 'jose';
import { DiscoverService } from '@/discover/discover.service';
import { HexclaveGuard } from '@/auth/hexclave.guard';
import {
  DiscoverScanDto,
  DiscoverScanResponseDto,
  DiscoverApplyDto,
  DiscoverApplyResponseDto,
} from '@/discover/dto/discover.dto';

type AuthenticatedRequest = Request & { hexclaveAuth?: JWTPayload };

@ApiTags('discover')
@Controller('api/discover')
export class DiscoverRouter {
  constructor(private readonly discoverService: DiscoverService) {}

  @Post('scan')
  @UseGuards(HexclaveGuard)
  @ApiOperation({ summary: 'Scan for discoverable games from IGDB' })
  @ApiBody({ type: DiscoverScanDto })
  @ApiResponse({ status: 200, type: DiscoverScanResponseDto })
  async scan(
    @Body() body: DiscoverScanDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<DiscoverScanResponseDto> {
    const actorId = req.hexclaveAuth?.sub ?? 'unknown';
    return this.discoverService.scan(body.count, actorId);
  }

  @Post('apply')
  @UseGuards(HexclaveGuard)
  @ApiOperation({ summary: 'Apply selected discover candidates' })
  @ApiBody({ type: DiscoverApplyDto })
  @ApiResponse({ status: 200, type: DiscoverApplyResponseDto })
  async apply(
    @Body() body: DiscoverApplyDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<DiscoverApplyResponseDto> {
    const actorId = req.hexclaveAuth?.sub ?? 'unknown';
    return this.discoverService.apply(
      body.selectedIgdbIds,
      body.scanEventId,
      actorId,
    );
  }
}
