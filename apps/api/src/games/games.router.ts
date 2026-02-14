import { Controller, UseGuards, NotFoundException } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { contract } from '@gaeldle/api-contract';
import { GamesService } from '@/games/games.service';
import { StackAuthGuard } from '@/auth/stack-auth.guard';

@Controller()
export class GamesRouter {
  constructor(private readonly gamesService: GamesService) {}

  @Implement(contract.games.list)
  list() {
    return implement(contract.games.list).handler(async ({ input }) => {
      const hasPagination =
        input?.page !== undefined ||
        input?.pageSize !== undefined ||
        input?.q !== undefined;

      if (hasPagination) {
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 10;
        const q = input?.q;

        const { games, total } = await this.gamesService.getGamesPage(
          page,
          Math.min(pageSize, 100),
          q,
        );

        return {
          success: true,
          data: games,
          meta: {
            page,
            pageSize,
            total,
          },
        };
      }

      const games = await this.gamesService.getAllGames();
      return {
        success: true,
        data: games,
      };
    });
  }

  @Implement(contract.games.get)
  get() {
    return implement(contract.games.get).handler(async ({ input }) => {
      const game = await this.gamesService.getGameByIgdbId(input.igdbId);

      if (!game) {
        throw new NotFoundException('Game not found');
      }

      return {
        success: true,
        data: game,
      };
    });
  }

  @Implement(contract.games.getArtwork)
  getArtwork() {
    return implement(contract.games.getArtwork).handler(async () => {
      const games = await this.gamesService.getArtworkGames();
      return {
        success: true,
        data: games,
      };
    });
  }

  @Implement(contract.games.search)
  search() {
    return implement(contract.games.search).handler(async ({ input }) => {
      const { q, limit, mode } = input;
      const games = await this.gamesService.searchGames(q, limit, mode);
      return {
        success: true,
        data: games,
      };
    });
  }

  @Implement(contract.games.getRandom)
  getRandom() {
    return implement(contract.games.getRandom).handler(async ({ input }) => {
      const game = await this.gamesService.getRandomGame(
        input?.excludeIds ?? [],
        input?.mode,
      );

      if (!game) {
        throw new NotFoundException('No games available');
      }

      return {
        success: true,
        data: game,
      };
    });
  }

  @Implement(contract.games.sync)
  @UseGuards(StackAuthGuard)
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
  @UseGuards(StackAuthGuard)
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

  @Implement(contract.games.delete)
  @UseGuards(StackAuthGuard)
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

  @Implement(contract.games.deleteBulk)
  @UseGuards(StackAuthGuard)
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
}
