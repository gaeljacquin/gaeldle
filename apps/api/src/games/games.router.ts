import { Controller, UseGuards, NotFoundException } from '@nestjs/common';
import sharp from 'sharp';
import { Implement, implement } from '@orpc/nest';
import { contract, type ImageStyle } from '@gaeldle/api-contract';
import { GamesService } from '@/games/games.service';
import { S3Service } from '@/lib/s3.service';
import { AiService } from '@/lib/ai.service';
import { StackAuthGuard } from '@/auth/stack-auth.guard';
import { TEST_DIR, IMAGE_GEN_DIR } from '@/lib/constants';
import { IMAGE_PROMPT_SUFFIX } from '@gaeldle/constants';
import { ConfigService } from '@nestjs/config';
import type { AppConfiguration } from '@/config/configuration';

@Controller()
export class GamesRouter {
  constructor(
    private readonly gamesService: GamesService,
    private readonly s3Service: S3Service,
    private readonly aiService: AiService,
    private readonly configService: ConfigService<AppConfiguration>,
  ) {}

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
        const sortBy = input?.sortBy ?? 'name';
        const sortDir = input?.sortDir ?? 'asc';

        const { games, total } = await this.gamesService.getGamesPage(
          page,
          Math.min(pageSize, 100),
          q,
          sortBy,
          sortDir,
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

  @Implement(contract.games.testUpload)
  testUpload() {
    return implement(contract.games.testUpload).handler(
      async ({ input }: { input: { image: string; extension: string } }) => {
        try {
          const { image, extension } = input;

          // Remove base64 prefix if present
          const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');

          const timestamp = Date.now();
          const fileName = `${TEST_DIR}/placeholder_${timestamp}.${extension}`;

          await this.s3Service.uploadImage(
            fileName,
            buffer,
            `image/${extension === 'jpg' ? 'jpeg' : extension}`,
          );

          return {
            success: true,
            url: fileName,
          };
        } catch (error) {
          console.error('Test upload failed:', error);
          throw error;
        }
      },
    );
  }

  @Implement(contract.games.generateImage)
  @UseGuards(StackAuthGuard)
  generateImage() {
    return implement(contract.games.generateImage).handler(
      async ({
        input,
      }: {
        input: {
          igdbId: number;
          includeStoryline?: boolean;
          includeGenres?: boolean;
          includeThemes?: boolean;
          imageStyle?: ImageStyle;
        };
      }) => {
        const {
          igdbId,
          includeStoryline,
          includeGenres,
          includeThemes,
          imageStyle,
        } = input;

        const game = await this.gamesService.getGameByIgdbId(igdbId);
        if (!game) throw new NotFoundException('Game not found');

        const prompt = this.buildImagePrompt(game, {
          includeStoryline: includeStoryline ?? false,
          includeGenres: includeGenres ?? false,
          includeThemes: includeThemes ?? false,
          imageStyle: imageStyle ?? 'funko-pop-chibi',
        });

        const rawBuffer = await this.aiService.generateImage(prompt);
        const imageBuffer = await sharp(rawBuffer)
          .jpeg({ quality: 85 })
          .toBuffer();

        const timestamp = Date.now();
        const key = `${IMAGE_GEN_DIR}/${igdbId}_${timestamp}.jpg`;
        await this.s3Service.uploadImage(key, imageBuffer, 'image/jpeg');

        const r2PublicUrlRaw =
          this.configService.get('r2PublicUrl', { infer: true }) ?? '';
        const r2PublicUrl = r2PublicUrlRaw.startsWith('http')
          ? r2PublicUrlRaw
          : `https://${r2PublicUrlRaw}`;
        const publicUrl = `${r2PublicUrl}/${key}`;

        const updatedGame = await this.gamesService.updateGame(game.id, {
          aiImageUrl: publicUrl,
          aiPrompt: prompt,
        });

        if (!updatedGame)
          throw new NotFoundException('Failed to update game record');

        return { success: true, url: publicUrl, data: updatedGame };
      },
    );
  }

  private static readonly IMAGE_STYLE_DESCRIPTORS: Record<ImageStyle, string> =
    {
      'funko-pop-chibi': 'Funko Pop chibi style illustration',
      simpsons: 'Simpsons style illustration',
      'rubber-hose-animation': 'Rubber hose animation style illustration',
      muppet: 'Muppet style illustration',
      lego: 'Lego style illustration',
      claymation: 'Claymation style illustration',
      'vector-art': 'Vector art style illustration',
      'digital-cel-shaded': 'Digital cel-shaded portrait illustration style',
      'western-animation-concept-art':
        'Western animation concept art style illustration',
      'graphic-novel-illustration': 'Graphic novel illustration style',
    };

  private buildImagePrompt(
    game: {
      name: string;
      summary?: string | null;
      storyline?: string | null;
      keywords?: unknown;
      genres?: unknown;
      themes?: unknown;
    },
    options: {
      includeStoryline: boolean;
      includeGenres: boolean;
      includeThemes: boolean;
      imageStyle: ImageStyle;
    },
  ): string {
    const parts: string[] = [];

    const descriptor = GamesRouter.IMAGE_STYLE_DESCRIPTORS[options.imageStyle];
    parts.push(
      `${descriptor} of iconic characters from "${game.name}" set within the game's distinct world`,
    );

    if (game.summary) {
      parts.push(game.summary);
    }

    if (options.includeStoryline && game.storyline) {
      parts.push(game.storyline);
    }

    if (
      options.includeGenres &&
      Array.isArray(game.genres) &&
      game.genres.length > 0
    ) {
      parts.push(`Genre: ${(game.genres as string[]).join(', ')}`);
    }

    if (
      options.includeThemes &&
      Array.isArray(game.themes) &&
      game.themes.length > 0
    ) {
      parts.push(`Themes: ${(game.themes as string[]).join(', ')}`);
    }

    if (Array.isArray(game.keywords) && game.keywords.length > 0) {
      parts.push(`Keywords: ${(game.keywords as string[]).join(', ')}`);
    }

    parts.push(IMAGE_PROMPT_SUFFIX);

    return parts.join('. ');
  }
}
