import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StackAuthGuard } from 'src/auth/stack-auth.guard';
import { GamesService, type GameUpdate } from 'src/games/games.service';
import {
  GAME_MODE_SLUGS,
  isGameModeSlug,
  type GameModeSlug,
} from 'src/games/game-mode';
import { parseNumberArray, parsePositiveInt } from 'src/lib/utils';

type GameUpdateBody = GameUpdate;

@Controller('api/games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}
  private readonly updateKeys: (keyof GameUpdateBody)[] = [
    'name',
    'info',
    'imageUrl',
    'artworks',
    'keywords',
    'franchises',
    'gameEngines',
    'gameModes',
    'genres',
    'involvedCompanies',
    'platforms',
    'playerPerspectives',
    'releaseDates',
    'themes',
    'firstReleaseDate',
    'summary',
    'storyline',
  ];

  /*
   * # GET /api/games (all games)
   * curl -i http://localhost:8080/api/games
   *
   * # GET /api/games with pagination
   * curl -i "http://localhost:8080/api/games?page=1&pageSize=10"
   */
  @Get()
  async getGames(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const hasPagination = Boolean(page || pageSize);

    if (hasPagination) {
      const pageNumber = parsePositiveInt(page, 1);
      const pageSizeNumber = parsePositiveInt(pageSize, 10);
      const cappedPageSize = Math.min(pageSizeNumber, 100);
      const { games, total } = await this.gamesService.getGamesPage(
        pageNumber,
        cappedPageSize,
      );

      return {
        success: true,
        data: games,
        meta: {
          page: pageNumber,
          pageSize: cappedPageSize,
          total,
        },
      };
    }

    const games = await this.gamesService.getAllGames();
    return {
      success: true,
      data: games,
    };
  }

  @Get('artwork')
  async getArtworkGames() {
    const games = await this.gamesService.getAllGames();
    return {
      success: true,
      data: games,
    };
  }

  /*
   * # GET /api/games/search
   * curl -i "http://localhost:8080/api/games/search?q=halo&limit=20&mode=artwork"
   */
  @Get('search')
  async searchGames(
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('mode') mode?: string,
  ) {
    if (!q || q.length < 2) {
      throw new BadRequestException({
        success: false,
        error: 'Search query must be at least 2 characters',
      });
    }

    if (mode && !isGameModeSlug(mode)) {
      throw new BadRequestException({
        success: false,
        error: `Invalid mode. Allowed: ${GAME_MODE_SLUGS.join(', ')}`,
      });
    }

    const parsedLimit = limit ? Number.parseInt(limit, 10) : 100;
    const safeLimit = Number.isFinite(parsedLimit) ? parsedLimit : 100;
    const games = await this.gamesService.searchGames(
      q,
      safeLimit,
      mode as GameModeSlug | undefined,
    );

    return {
      success: true,
      data: games,
    };
  }

  /*
   * # POST /api/games/random
   * curl -i -X POST http://localhost:8080/api/games/random \
   *   -H "Content-Type: application/json" \
   *   -d '{"excludeIds":[1076,42],"mode":"artwork"}'
   *
   * curl -i -X POST http://localhost:8080/api/games/random \
   *   -H "Content-Type: application/json" \
   *   -d '{}'
   */
  @Post('random')
  @HttpCode(200)
  async getRandomGame(@Body() body: { excludeIds?: number[]; mode?: string }) {
    if (body?.mode && !isGameModeSlug(body.mode)) {
      throw new BadRequestException({
        success: false,
        error: `Invalid mode. Allowed: ${GAME_MODE_SLUGS.join(', ')}`,
      });
    }

    const excludeIds = parseNumberArray(body?.excludeIds);
    const game = await this.gamesService.getRandomGame(excludeIds);

    if (!game) {
      throw new HttpException(
        {
          success: false,
          error: 'No games available',
        },
        404,
      );
    }

    return {
      success: true,
      data: game,
    };
  }

  /*
   * # POST /api/games/sync
   * curl -i -X POST http://localhost:8080/api/games/sync \
   *   -H "Authorization: Bearer <STACK_ACCESS_TOKEN>" \
   *   -H "Content-Type: application/json" \
   *   -d '{"igdb_id":7346}'
   */
  @Post('sync')
  @UseGuards(StackAuthGuard)
  async syncGame(@Body() body: { igdb_id?: number }) {
    const igdbId = parsePositiveInt(
      typeof body?.igdb_id === 'number' ? String(body.igdb_id) : undefined,
      Number.NaN,
    );

    if (!Number.isFinite(igdbId)) {
      throw new BadRequestException({
        success: false,
        error: 'igdb_id must be a positive integer',
      });
    }

    try {
      const result = await this.gamesService.syncGameByIgdbId(igdbId);

      if (!result) {
        throw new HttpException(
          {
            success: false,
            error: 'Game not found in IGDB',
          },
          404,
        );
      }

      return {
        success: true,
        message: `Game ${result.operation}`,
        operation: result.operation,
        data: result.game,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const errorMessage = this.getSyncErrorMessage(error);
      throw new HttpException(
        {
          success: false,
          error: `Failed to sync game from IGDB: ${errorMessage}`,
        },
        502,
      );
    }
  }

  /*
   * # PATCH /api/games/:id
   * curl -i -X PATCH http://localhost:8080/api/games/42 \
   *   -H "Authorization: Bearer <STACK_ACCESS_TOKEN>" \
   *   -H "Content-Type: application/json" \
   *   -d '{"name":"Updated Name","summary":"New summary"}'
   */
  @Patch(':id')
  @UseGuards(StackAuthGuard)
  async updateGame(@Param('id') idParam: string, @Body() body: GameUpdateBody) {
    const id = this.parseGameId(idParam);
    const updates = this.pickGameUpdates(body);

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException({
        success: false,
        error: 'No valid fields provided to update',
      });
    }

    const updatedGame = await this.gamesService.updateGame(id, updates);

    if (!updatedGame) {
      throw new HttpException(
        {
          success: false,
          error: 'Game not found',
        },
        404,
      );
    }

    return {
      success: true,
      data: updatedGame,
    };
  }

  /*
   * # DELETE /api/games/:id
   * curl -i -X DELETE http://localhost:8080/api/games/42 \
   *   -H "Authorization: Bearer <STACK_ACCESS_TOKEN>"
   */
  @Delete(':id')
  @UseGuards(StackAuthGuard)
  async deleteGame(@Param('id') idParam: string) {
    const id = this.parseGameId(idParam);
    const deletedId = await this.gamesService.deleteGame(id);

    if (!deletedId) {
      throw new HttpException(
        {
          success: false,
          error: 'Game not found',
        },
        404,
      );
    }

    return {
      success: true,
      data: { id: deletedId },
    };
  }

  /*
   * # DELETE /api/games (bulk)
   * curl -i -X DELETE http://localhost:8080/api/games \
   *   -H "Authorization: Bearer <STACK_ACCESS_TOKEN>" \
   *   -H "Content-Type: application/json" \
   *   -d '{"ids":[1,2,3]}'
   */
  @Delete()
  @UseGuards(StackAuthGuard)
  async deleteGames(@Body() body: { ids?: number[] }) {
    const ids = Array.from(new Set(parseNumberArray(body?.ids))).filter(
      (id) => id > 0,
    );

    if (ids.length === 0) {
      throw new BadRequestException({
        success: false,
        error: 'ids must be a non-empty array of positive integers',
      });
    }

    const deletedIds = await this.gamesService.deleteGames(ids);

    return {
      success: true,
      data: {
        deletedIds,
      },
    };
  }

  private parseGameId(value?: string): number {
    const parsed = parsePositiveInt(value, Number.NaN);
    if (!Number.isFinite(parsed)) {
      throw new BadRequestException({
        success: false,
        error: 'Invalid game id',
      });
    }
    return parsed;
  }

  private pickGameUpdates(body: GameUpdateBody): GameUpdateBody {
    const updates: Partial<Record<keyof GameUpdateBody, unknown>> = {};

    for (const key of this.updateKeys) {
      const value = body?.[key];
      if (value !== undefined) {
        updates[key] = value;
      }
    }

    return updates as GameUpdateBody;
  }

  private getSyncErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      const cause = (error as Error & { cause?: unknown }).cause;
      if (cause instanceof Error && cause.message) {
        return cause.message;
      }

      const causeWithMessage = cause as { message?: unknown } | undefined;
      if (typeof causeWithMessage?.message === 'string') {
        return causeWithMessage.message;
      }

      return error.message;
    }

    return 'Unknown error';
  }
}
