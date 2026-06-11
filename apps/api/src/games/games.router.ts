import { Controller, UseGuards, NotFoundException } from '@nestjs/common';
import sharp from 'sharp';
import { Implement, implement } from '@orpc/nest';
import { artStyles, contract, type ArtStyle } from '@workspace/api-contract';
import { GamesService } from '@/games/games.service';
import { S3Service } from '@/lib/s3.service';
import { AiService } from '@/lib/ai.service';
import { HexclaveGuard } from '@/auth/hexclave.guard';
import {
  DEFAULT_IMAGE_GEN_ART_STYLE,
  IMAGE_GEN_DIR,
  IMAGE_PROMPT_SUFFIX,
} from '@workspace/shared';
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
      async ({
        input,
      }: {
        input: {
          igdbId: number;
          includeStoryline?: boolean;
          includeGenres?: boolean;
          includeThemes?: boolean;
          artStyle?: ArtStyle;
        };
      }) => {
        const {
          igdbId,
          includeStoryline,
          includeGenres,
          includeThemes,
          artStyle,
        } = input;

        const game = await this.gamesService.getGameByIgdbId(igdbId);
        if (!game) throw new NotFoundException('Game not found');

        const prompt = this.buildImagePrompt(game, {
          includeStoryline: includeStoryline ?? false,
          includeGenres: includeGenres ?? false,
          includeThemes: includeThemes ?? false,
          artStyle: artStyle ?? DEFAULT_IMAGE_GEN_ART_STYLE,
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
        const list = Array.isArray(game.imageGen)
          ? JSON.parse(JSON.stringify(game.imageGen))
          : [];
        const styleKey = artStyle ?? DEFAULT_IMAGE_GEN_ART_STYLE;
        const newItem = {
          [styleKey]: {
            url: publicUrl,
            prompt: prompt,
            provider: 'cloudflare',
          },
        };
        const existingIndex = list.findIndex(
          (item: any) => item && typeof item === 'object' && styleKey in item,
        );
        if (existingIndex >= 0) {
          list[existingIndex] = newItem;
        } else {
          list.push(newItem);
        }
        const updatedImageGen = list;

        const updatedGame = await this.gamesService.updateGame(game.id, {
          aiImageUrl: publicUrl,
          aiPrompt: prompt,
          imageGen: updatedImageGen,
        });

        if (!updatedGame)
          throw new NotFoundException('Failed to update game record');

        return { success: true, url: publicUrl, data: updatedGame };
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

  private static readonly ART_STYLE_DESCRIPTORS: Record<ArtStyle, string> =
    artStyles.reduce((acc, artStyle) => {
      const { value, descriptor } = artStyle;
      acc[value] = descriptor;

      return acc;
    });

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
      artStyle: ArtStyle;
    },
  ): string {
    const parts: string[] = [];

    const descriptor = GamesRouter.ART_STYLE_DESCRIPTORS[options.artStyle];
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
