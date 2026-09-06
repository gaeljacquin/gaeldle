import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GamesService } from '@/games/games.service';
import { HexclaveGuard } from '@/auth/hexclave.guard';
import { GameListResponseDto } from '@/games/dto/games.dto';

@ApiTags('wishlists')
@Controller('api/wishlists')
@UseGuards(HexclaveGuard)
export class WishlistsRouter {
  constructor(private readonly gamesService: GamesService) {}

  @Get('steam')
  @ApiOperation({ summary: 'Get all Steam wishlist games' })
  @ApiResponse({ status: 200, type: GameListResponseDto })
  async getSteamWishlist(): Promise<GameListResponseDto> {
    const data = await this.gamesService.getGamesByFilter('steamWishlist');
    return { success: true, data };
  }

  @Get('epic')
  @ApiOperation({ summary: 'Get all Epic wishlist games' })
  @ApiResponse({ status: 200, type: GameListResponseDto })
  async getEpicWishlist(): Promise<GameListResponseDto> {
    const data = await this.gamesService.getGamesByFilter('epicWishlist');
    return { success: true, data };
  }

  @Get('nintendo')
  @ApiOperation({ summary: 'Get all Nintendo wishlist games' })
  @ApiResponse({ status: 200, type: GameListResponseDto })
  async getNintendoWishlist(): Promise<GameListResponseDto> {
    const data = await this.gamesService.getGamesByFilter('nintendoWishlist');
    return { success: true, data };
  }

  @Get('humble-bundle')
  @ApiOperation({ summary: 'Get all Humble Bundle wishlist games' })
  @ApiResponse({ status: 200, type: GameListResponseDto })
  async getHumbleBundleWishlist(): Promise<GameListResponseDto> {
    const data = await this.gamesService.getGamesByFilter(
      'humbleBundleWishlist',
    );
    return { success: true, data };
  }
}
