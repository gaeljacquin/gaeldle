import { Controller, UseGuards, NotFoundException, Req } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { contract } from '@workspace/api-contract';
import { ClueService } from './clue.service';
import {
  HexclaveGuard,
  type AuthenticatedRequest,
} from '@/auth/hexclave.guard';

@Controller()
export class ClueRouter {
  constructor(private readonly clueService: ClueService) {}

  @Implement(contract.clue.generateClue)
  @UseGuards(HexclaveGuard)
  generateClue(@Req() req: AuthenticatedRequest) {
    return implement(contract.clue.generateClue).handler(async ({ input }) => {
      const actorId = req.hexclave?.sub || req.hexclaveAuth?.sub || 'unknown';
      const updatedGame = await this.clueService.generateClue(
        input.igdbId,
        input.provider,
        actorId,
      );

      if (!updatedGame) {
        throw new NotFoundException('Game not found');
      }

      return {
        success: true,
        data: updatedGame,
      };
    });
  }

  @Implement(contract.clue.getClueHistory)
  @UseGuards(HexclaveGuard)
  getClueHistory() {
    return implement(contract.clue.getClueHistory).handler(
      async ({ input }) => {
        return this.clueService.getClueHistory(input.igdbId);
      },
    );
  }

  @Implement(contract.clue.restoreClue)
  @UseGuards(HexclaveGuard)
  restoreClue(@Req() req: AuthenticatedRequest) {
    return implement(contract.clue.restoreClue).handler(async ({ input }) => {
      const actorId = req.hexclave?.sub || req.hexclaveAuth?.sub || 'unknown';
      const updatedGame = await this.clueService.restoreClue(
        input.igdbId,
        input.historyId,
        actorId,
      );

      if (!updatedGame) {
        throw new NotFoundException('Game not found');
      }

      return {
        success: true,
        data: updatedGame,
      };
    });
  }
}
