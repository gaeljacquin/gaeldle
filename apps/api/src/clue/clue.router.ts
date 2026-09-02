import {
  Controller,
  Post,
  Get,
  Body,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { ClueService } from './clue.service';
import {
  HexclaveGuard,
  type AuthenticatedRequest,
} from '@/auth/hexclave.guard';
import {
  GenerateClueDto,
  GenerateClueResponseDto,
  RestoreClueDto,
  GameClueHistoryDto,
} from '@/clue/dto/clue.dto';

@ApiTags('clue')
@Controller('api/clue')
export class ClueRouter {
  constructor(private readonly clueService: ClueService) {}

  @Post('generate-clue')
  @UseGuards(HexclaveGuard)
  @ApiOperation({ summary: 'Generate a text clue for a game' })
  @ApiBody({ type: GenerateClueDto })
  @ApiResponse({ status: 200, type: GenerateClueResponseDto })
  async generateClue(
    @Body() body: GenerateClueDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<GenerateClueResponseDto> {
    const actorId = req.hexclave?.sub ?? 'unknown';
    const updatedGame = await this.clueService.generateClue(
      body.igdbId,
      body.provider,
      actorId,
    );

    if (!updatedGame) {
      throw new NotFoundException('Game not found');
    }

    return {
      success: true,
      data: updatedGame,
    };
  }

  @Get('history')
  @UseGuards(HexclaveGuard)
  @ApiOperation({ summary: 'Get clue generation history for a game' })
  @ApiQuery({ name: 'igdbId', type: Number })
  @ApiResponse({ status: 200, type: [GameClueHistoryDto] })
  async getClueHistory(@Query('igdbId', ParseIntPipe) igdbId: number) {
    return this.clueService.getClueHistory(igdbId);
  }

  @Post('restore')
  @UseGuards(HexclaveGuard)
  @ApiOperation({ summary: 'Restore a previous clue from history' })
  @ApiBody({ type: RestoreClueDto })
  @ApiResponse({ status: 200, type: GenerateClueResponseDto })
  async restoreClue(
    @Body() body: RestoreClueDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<GenerateClueResponseDto> {
    const actorId = req.hexclave?.sub ?? 'unknown';
    const updatedGame = await this.clueService.restoreClue(
      body.igdbId,
      body.historyId,
      actorId,
    );

    if (!updatedGame) {
      throw new NotFoundException('Game not found');
    }

    return {
      success: true,
      data: updatedGame,
    };
  }
}
