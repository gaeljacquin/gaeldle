import { Controller, UseGuards, NotFoundException, Req } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { contract } from '@workspace/api-contract';
import { GamesService } from '@/games/games.service';
import {
  HexclaveGuard,
  type AuthenticatedRequest,
} from '@/auth/hexclave.guard';

@Controller()
export class GamesRouter {
  constructor(private readonly gamesService: GamesService) {}

  @Implement(contract.games.sync)
  @UseGuards(HexclaveGuard)
  sync(@Req() req: AuthenticatedRequest) {
    return implement(contract.games.sync).handler(async ({ input }) => {
      const actorId = req.hexclave?.sub || req.hexclaveAuth?.sub || 'unknown';
      const result = await this.gamesService.syncGameByIgdbId(
        input.igdb_id,
        true,
        actorId,
      );

      if (!result) {
        throw new NotFoundException('Game not found in IGDB');
      }

      return {
        success: true,
        message: `Game ${result.operation}`,
        operation: result.operation,
        data: result.game,
      };
    });
  }

  @Implement(contract.games.update)
  @UseGuards(HexclaveGuard)
  update() {
    return implement(contract.games.update).handler(async ({ input }) => {
      const { id, updates } = input;
      const updatedGame = await this.gamesService.updateGame(id, updates);

      if (!updatedGame) {
        throw new NotFoundException('Game not found');
      }

      return {
        success: true,
        data: updatedGame,
      };
    });
  }

  @Implement(contract.games.deleteBulk)
  @UseGuards(HexclaveGuard)
  deleteBulk() {
    return implement(contract.games.deleteBulk).handler(async ({ input }) => {
      const deletedIds = await this.gamesService.deleteGames(input);
      return {
        success: true,
        data: {
          deletedIds,
        },
      };
    });
  }

  @Implement(contract.games.delete)
  @UseGuards(HexclaveGuard)
  delete() {
    return implement(contract.games.delete).handler(async ({ input }) => {
      const deletedId = await this.gamesService.deleteGame(input.id);

      if (!deletedId) {
        throw new NotFoundException('Game not found');
      }

      return {
        success: true,
        data: { id: deletedId },
      };
    });
  }

  @Implement(contract.games.validateIgdbIdAdd)
  @UseGuards(HexclaveGuard)
  validateIgdbIdAdd(@Req() req: AuthenticatedRequest) {
    return implement(contract.games.validateIgdbIdAdd).handler(({ input }) => {
      const actorId = req.hexclave?.sub || req.hexclaveAuth?.sub || 'unknown';

      return this.gamesService.validateGameForAdd(input.igdbId, actorId);
    });
  }
}
