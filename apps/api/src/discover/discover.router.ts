import { Controller, UseGuards, Req } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import type { Request } from 'express';
import type { JWTPayload } from 'jose';
import { contract } from '@workspace/api-contract';
import { DiscoverService } from '@/discover/discover.service';
import { HexclaveGuard } from '@/auth/hexclave.guard';

type AuthenticatedRequest = Request & { hexclaveAuth?: JWTPayload };

@Controller()
export class DiscoverRouter {
  constructor(private readonly discoverService: DiscoverService) {}

  @Implement(contract.discover.scan)
  @UseGuards(HexclaveGuard)
  scan(@Req() req: AuthenticatedRequest) {
    return implement(contract.discover.scan).handler(({ input }) => {
      const actorId = req.hexclaveAuth?.sub ?? 'unknown';
      return this.discoverService.scan(input.count, actorId);
    });
  }

  @Implement(contract.discover.apply)
  @UseGuards(HexclaveGuard)
  apply(@Req() req: AuthenticatedRequest) {
    return implement(contract.discover.apply).handler(({ input }) => {
      const actorId = req.hexclaveAuth?.sub ?? 'unknown';
      return this.discoverService.apply(
        input.selectedIgdbIds,
        input.scanEventId,
        actorId,
      );
    });
  }
}
