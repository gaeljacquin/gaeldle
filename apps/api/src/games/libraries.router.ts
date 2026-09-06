import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GamesService } from '@/games/games.service';
import { HexclaveGuard } from '@/auth/hexclave.guard';
import { GameListResponseDto } from '@/games/dto/games.dto';

@ApiTags('libraries')
@Controller('api/libraries')
@UseGuards(HexclaveGuard)
export class LibrariesRouter {
  constructor(private readonly gamesService: GamesService) {}

  @Get('steam')
  @ApiOperation({ summary: 'Get all Steam games' })
  @ApiResponse({ status: 200, type: GameListResponseDto })
  async getSteamGames(): Promise<GameListResponseDto> {
    const data = await this.gamesService.getGamesByFilter('steam');
    return { success: true, data };
  }

  @Get('amazon')
  @ApiOperation({ summary: 'Get all Amazon games' })
  @ApiResponse({ status: 200, type: GameListResponseDto })
  async getAmazonGames(): Promise<GameListResponseDto> {
    const data = await this.gamesService.getGamesByFilter('amazon');
    return { success: true, data };
  }

  @Get('gog')
  @ApiOperation({ summary: 'Get all GOG games' })
  @ApiResponse({ status: 200, type: GameListResponseDto })
  async getGogGames(): Promise<GameListResponseDto> {
    const data = await this.gamesService.getGamesByFilter('gog');
    return { success: true, data };
  }

  @Get('epic')
  @ApiOperation({ summary: 'Get all Epic games' })
  @ApiResponse({ status: 200, type: GameListResponseDto })
  async getEpicGames(): Promise<GameListResponseDto> {
    const data = await this.gamesService.getGamesByFilter('epic');
    return { success: true, data };
  }

  @Get('xbox')
  @ApiOperation({ summary: 'Get all Xbox games' })
  @ApiResponse({ status: 200, type: GameListResponseDto })
  async getXboxGames(): Promise<GameListResponseDto> {
    const data = await this.gamesService.getGamesByFilter('xbox');
    return { success: true, data };
  }

  @Get('nintendo')
  @ApiOperation({ summary: 'Get all Nintendo games' })
  @ApiResponse({ status: 200, type: GameListResponseDto })
  async getNintendoGames(): Promise<GameListResponseDto> {
    const data = await this.gamesService.getGamesByFilter('nintendo');
    return { success: true, data };
  }
}
