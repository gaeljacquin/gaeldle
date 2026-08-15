import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  NotFoundException,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { GamesService } from '@/games/games.service';
import {
  HexclaveGuard,
  type AuthenticatedRequest,
} from '@/auth/hexclave.guard';
import {
  SyncGameDto,
  SyncGameResponseDto,
  GameUpdateInputDto,
  UpdateGameDto,
  GameResponseDto,
  DeleteGameResponseDto,
  DeleteBulkDto,
  DeleteBulkGamesResponseDto,
  ValidateIgdbIdAddDto,
  ValidateIgdbIdAddResponseDto,
} from '@/games/dto/games.dto';

@ApiTags('games')
@Controller('api/games')
export class GamesRouter {
  constructor(private readonly gamesService: GamesService) {}

  @Post('sync')
  @UseGuards(HexclaveGuard)
  @ApiOperation({ summary: 'Sync game by IGDB ID' })
  @ApiBody({ type: SyncGameDto })
  @ApiResponse({ status: 200, type: SyncGameResponseDto })
  async sync(
    @Body() body: SyncGameDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SyncGameResponseDto> {
    const actorId = req.hexclave?.sub || req.hexclaveAuth?.sub || 'unknown';
    const result = await this.gamesService.syncGameByIgdbId(
      body.igdb_id,
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
  }

  @Patch(':id')
  @UseGuards(HexclaveGuard)
  @ApiOperation({ summary: 'Update game details' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateGameDto })
  @ApiResponse({ status: 200, type: GameResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateGameDto | GameUpdateInputDto,
  ): Promise<GameResponseDto> {
    const updates =
      'updates' in body && body.updates
        ? body.updates
        : (body as GameUpdateInputDto);
    const updatedGame = await this.gamesService.updateGame(id, updates);

    if (!updatedGame) {
      throw new NotFoundException('Game not found');
    }

    return {
      success: true,
      data: updatedGame,
    };
  }

  @Delete('bulk')
  @UseGuards(HexclaveGuard)
  @ApiOperation({ summary: 'Delete multiple games by ID' })
  @ApiBody({ type: DeleteBulkDto })
  @ApiResponse({ status: 200, type: DeleteBulkGamesResponseDto })
  async deleteBulk(
    @Body() body: DeleteBulkDto | number[],
  ): Promise<DeleteBulkGamesResponseDto> {
    const ids = Array.isArray(body) ? body : body.ids;
    const deletedIds = await this.gamesService.deleteGames(ids);
    return {
      success: true,
      data: {
        deletedIds,
      },
    };
  }

  @Delete(':id')
  @UseGuards(HexclaveGuard)
  @ApiOperation({ summary: 'Delete game by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: DeleteGameResponseDto })
  async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DeleteGameResponseDto> {
    const deletedId = await this.gamesService.deleteGame(id);

    if (!deletedId) {
      throw new NotFoundException('Game not found');
    }

    return {
      success: true,
      data: { id: deletedId },
    };
  }

  @Post('add/validate-one')
  @UseGuards(HexclaveGuard)
  @ApiOperation({ summary: 'Validate IGDB ID before adding' })
  @ApiBody({ type: ValidateIgdbIdAddDto })
  @ApiResponse({ status: 200, type: ValidateIgdbIdAddResponseDto })
  async validateIgdbIdAdd(
    @Body() body: ValidateIgdbIdAddDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ValidateIgdbIdAddResponseDto> {
    const actorId = req.hexclave?.sub || req.hexclaveAuth?.sub || 'unknown';
    return this.gamesService.validateGameForAdd(body.igdbId, actorId);
  }
}
