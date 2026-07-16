import { Controller, UseGuards, NotFoundException, Req } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { contract } from '@workspace/api-contract';
import { InfoGenService } from './info-gen.service';
import {
  HexclaveGuard,
  type AuthenticatedRequest,
} from '@/auth/hexclave.guard';

@Controller()
export class InfoGenRouter {
  constructor(private readonly infoGenService: InfoGenService) {}

  @Implement(contract.infoGen.generateInfo)
  @UseGuards(HexclaveGuard)
  generateInfo(@Req() req: AuthenticatedRequest) {
    return implement(contract.infoGen.generateInfo).handler(
      async ({ input }) => {
        const actorId = req.hexclave?.sub || req.hexclaveAuth?.sub || 'unknown';
        const updatedGame = await this.infoGenService.generateInfo(
          input.igdbId,
          actorId,
        );

        if (!updatedGame) {
          throw new NotFoundException('Game not found');
        }

        return {
          success: true,
          data: updatedGame,
        };
      },
    );
  }
}
