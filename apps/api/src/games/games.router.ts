import { Controller, UseGuards, NotFoundException } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { contract } from '@workspace/api-contract';
import { GamesService } from '@/games/games.service';
import { HexclaveGuard } from '@/auth/hexclave.guard';

@Controller()
export class GamesRouter {
  constructor(private readonly gamesService: GamesService) {}

  @Implement(contract.games.sync)
  @UseGuards(HexclaveGuard)
  sync() {
    return implement(contract.games.sync).handler(async ({ input }) => {
      const result = await this.gamesService.syncGameByIgdbId(input.igdb_id);

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

  @Implement(contract.games.generateImage)
  @UseGuards(HexclaveGuard)
  generateImage() {
    return implement(contract.games.generateImage).handler(
      async ({ input }) => {
        const result = await this.gamesService.generateImage(input);

        if (!result) {
          throw new NotFoundException('Game not found');
        }

        return result;
      },
    );
  }

  @Implement(contract.games.bulkGenerateImages)
  @UseGuards(HexclaveGuard)
  bulkGenerateImages() {
    return implement(contract.games.bulkGenerateImages).handler(
      async ({ input }) => {
        const { jobId, gamesQueued } =
          await this.gamesService.bulkGenerateImages(input);

        return { success: true, jobId, gamesQueued };
      },
    );
  }

  @Implement(contract.games.getBulkJobStatus)
  @UseGuards(HexclaveGuard)
  getBulkJobStatus() {
    return implement(contract.games.getBulkJobStatus).handler(
      async ({ input }) => {
        const job = await this.gamesService.getBulkJobStatus(input.jobId);

        return { success: true, ...job };
      },
    );
  }

  @Implement(contract.games.validateReplaceGame)
  @UseGuards(HexclaveGuard)
  validateReplaceGame() {
    return implement(contract.games.validateReplaceGame).handler(
      async ({ input }) => {
        return this.gamesService.validateGameByIgdbId(
          input.current,
          input.replacement,
        );
      },
    );
  }

  @Implement(contract.games.replaceGames)
  @UseGuards(HexclaveGuard)
  replaceGames() {
    return implement(contract.games.replaceGames).handler(async ({ input }) => {
      return this.gamesService.replaceGameByIgdbId(input);
    });
  }

  @Implement(contract.games.validateIgdbIdAdd)
  @UseGuards(HexclaveGuard)
  validateIgdbIdAdd() {
    return implement(contract.games.validateIgdbIdAdd).handler(({ input }) =>
      this.gamesService.validateGameForAdd(input.igdbId),
    );
  }
}
