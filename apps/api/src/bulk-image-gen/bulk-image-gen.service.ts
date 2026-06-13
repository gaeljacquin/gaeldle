import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '@/db/database.service';
import {
  games,
  bigJobTable,
  type Game,
  gameObject,
  artStyles as artStylesView,
  type ArtStyleValue,
  GameInsert,
  JobStatus,
} from '@workspace/api-contract';
import { type IgdbGame } from '@/lib/igdb.service';
import { AiService } from '@/lib/ai.service';
import { S3Service } from '@/lib/s3.service';
import { BulkImageJobStore } from '@/bulk-image-gen/bulk-image-job.store';
import type { AppConfiguration } from '@/config/configuration';
import { IMAGE_GEN_DIR, IMAGE_PROMPT_SUFFIX } from '@workspace/shared';
import { GamesService } from '@/games/games.service';

interface GenerateImageInput {
  igdbId: number;
  includeStoryline?: boolean;
  includeGenres?: boolean;
  includeThemes?: boolean;
  artStyle?: ArtStyleValue; // effectively artStyleValue, not renaming this to be consistent with bulkImageGenJobs
}

@Injectable()
export class BulkImageGenService {
  constructor(
    private readonly gamesService: GamesService,
    private readonly databaseService: DatabaseService,
    private readonly aiService: AiService,
    private readonly s3Service: S3Service,
    private readonly bulkImageJobStore: BulkImageJobStore,
    private readonly configService: ConfigService<AppConfiguration>,
  ) {}

  async bulkGenerateImages(params: {
    numGames: number;
    artStyle: ArtStyleValue; // effectively artStyleValue, not renaming this to be consistent with bulkImageGenJobs
    includeStoryline: boolean;
    includeGenres: boolean;
    includeThemes: boolean;
  }): Promise<{ jobId: string; gamesQueued: number }> {
    const [activeJob] = await this.databaseService.db
      .select({ id: bigJobTable.id })
      .from(bigJobTable)
      .where(sql`${bigJobTable.status} IN ('pending', 'running')`)
      .limit(1);

    if (activeJob) {
      throw new ConflictException(
        'A bulk image generation job is already active. Please wait for it to finish.',
      );
    }

    // Query games where ai_image_url IS NULL
    const pendingGames = await this.databaseService.db
      .select(gameObject)
      .from(games)
      .where(sql`${games.aiImageUrl} IS NULL`)
      .limit(params.numGames);

    const total = pendingGames.length;

    if (total === 0) {
      throw new ConflictException(
        'No games without AI images found. All games already have AI-generated images.',
      );
    }

    const jobId = randomUUID();

    // Insert the job record
    await this.databaseService.db.insert(bigJobTable).values({
      jobId,
      status: 'pending',
      total,
      processed: 0,
      succeeded: 0,
      failed: 0,
      failures: [],
      params,
    });

    // Run the generation loop asynchronously (fire-and-forget)
    this.runGenerationLoop(jobId, pendingGames, params).catch((err) => {
      console.error(`[BulkImageGen] Fatal error for job ${jobId}:`, err);
    });

    return { jobId, gamesQueued: total };
  }

  private async runGenerationLoop(
    jobId: string,
    pendingGames: Game[],
    params: {
      numGames: number;
      artStyle: ArtStyleValue; // effectively artStyleValue, not renaming this to be consistent with bulkImageGenJobs
      includeStoryline: boolean;
      includeGenres: boolean;
      includeThemes: boolean;
    },
  ): Promise<void> {
    const total = pendingGames.length;
    const failures: Array<{ igdbId: number; gameName: string; error: string }> =
      [];
    const { artStyle: artStyleValue } = params; // effectively artStyleValue, not renaming this to be consistent with bulkImageGenJobs
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    await this.databaseService.db
      .update(bigJobTable)
      .set({ status: 'running', startedAt: new Date() })
      .where(eq(bigJobTable.jobId, jobId));

    const artStyle = await this.databaseService.db
      .select({
        value: artStylesView.value,
        description: artStylesView.description,
      })
      .from(artStylesView)
      .where(eq(artStylesView.value, artStyleValue))
      .then((rows) => rows[0]);

    if (!artStyle?.description) {
      throw new Error('No art style description found.');
    }

    const r2PublicUrlRaw =
      this.configService.get('r2PublicUrl', { infer: true }) ?? '';
    const r2PublicUrl = r2PublicUrlRaw.startsWith('http')
      ? r2PublicUrlRaw
      : `https://${r2PublicUrlRaw}`;

    for (const game of pendingGames) {
      try {
        const prompt = this.buildImagePrompt(
          game,
          params,
          artStyle?.description,
        );
        const rawBuffer = await this.aiService.generateImage(prompt);
        const imageBuffer = await sharp(rawBuffer)
          .jpeg({ quality: 85 })
          .toBuffer();
        const timestamp = Date.now();
        const key = `${IMAGE_GEN_DIR}/${game.igdbId}_${timestamp}.jpg`;

        await this.s3Service.uploadImage(key, imageBuffer, 'image/jpeg');

        const publicUrl = `${r2PublicUrl}/${key}`;
        const list = Array.isArray(game.imageGen)
          ? JSON.parse(JSON.stringify(game.imageGen))
          : [];
        const asvKey = artStyleValue;
        const newItem = {
          [asvKey]: {
            url: publicUrl,
            prompt: prompt,
            provider: 'cloudflare',
          },
        };
        const existingIndex = list.findIndex(
          (item: any) => item && typeof item === 'object' && asvKey in item,
        );

        if (existingIndex >= 0) {
          list[existingIndex] = newItem;
        } else {
          list.push(newItem);
        }

        const updatedImageGen = list;

        await this.databaseService.db
          .update(games)
          .set({
            aiImageUrl: publicUrl,
            aiPrompt: prompt,
            imageGen: updatedImageGen,
            updatedAt: new Date(),
          })
          .where(eq(games.id, game.id));

        succeeded++;
      } catch (err) {
        failed++;

        const errorMessage = err instanceof Error ? err.message : String(err);

        failures.push({
          igdbId: game.igdbId,
          gameName: game.name,
          error: errorMessage,
        });

        console.error(
          `[BulkImageGen] Failed to process game ${game.name} (${game.igdbId}):`,
          errorMessage,
        );
      }

      processed++;

      await this.databaseService.db
        .update(bigJobTable)
        .set({ processed, succeeded, failed, failures })
        .where(eq(bigJobTable.jobId, jobId));

      this.bulkImageJobStore.emit(jobId, {
        type: 'progress',
        data: {
          processed,
          succeeded,
          failed,
          total,
          latestGame: game.name,
        },
      });
    }

    const finalStatus = failed === total ? 'failed' : 'completed';

    await this.databaseService.db
      .update(bigJobTable)
      .set({
        status: finalStatus,
        completedAt: new Date(),
        processed,
        succeeded,
        failed,
        failures,
      })
      .where(eq(bigJobTable.jobId, jobId));

    this.bulkImageJobStore.emit(jobId, {
      type: 'completed',
      data: { succeeded, failed, failures },
    });

    await this.gamesService.refreshAllGamesView();
  }

  async getBulkJobStatus(jobId: string) {
    const [job] = await this.databaseService.db
      .select()
      .from(bigJobTable)
      .where(eq(bigJobTable.jobId, jobId))
      .limit(1);

    if (!job) {
      throw new NotFoundException(`Bulk image job ${jobId} not found`);
    }

    return {
      jobId: job.jobId,
      status: job.status as JobStatus,
      total: job.total,
      processed: job.processed,
      succeeded: job.succeeded,
      failed: job.failed,
      failures: (job.failures ?? []) as Array<{
        igdbId: number;
        gameName: string;
        error: string;
      }>,
      params: job.params,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      createdAt: job.createdAt!,
    };
  }

  private mapIgdbToGame(igdbGame: IgdbGame): GameInsert {
    const formatUrl = (url?: string) => {
      if (!url) {
        return undefined;
      }

      const fullUrl = url.startsWith('//') ? `https:${url}` : url;

      return fullUrl.replace('t_thumb', 't_720p');
    };

    return {
      igdbId: igdbGame.id,
      name: igdbGame.name,
      summary: igdbGame.summary,
      storyline: igdbGame.storyline,
      firstReleaseDate: igdbGame.first_release_date,
      imageUrl: formatUrl(igdbGame.cover?.url),
      artworks: igdbGame.artworks?.map((art) => ({
        ...art,
        url: formatUrl(art.url),
      })),
      platforms: igdbGame.platforms?.map((p) => p.name),
      genres: igdbGame.genres?.map((g) => g.name),
      themes: igdbGame.themes?.map((t) => t.name),
      gameModes: igdbGame.game_modes?.map((m) => m.name),
      playerPerspectives: igdbGame.player_perspectives?.map((p) => p.name),
      gameEngines: igdbGame.game_engines?.map((e) => e.name),
      involvedCompanies: igdbGame.involved_companies?.map((c) => ({
        name: c.company?.name,
        developer: c.developer,
        publisher: c.publisher,
      })),
      keywords: igdbGame.keywords?.map((k) => k.name),
      franchises: igdbGame.franchises?.map((f) => f.name),
      releaseDates: igdbGame.release_dates?.map((rd) => ({
        date: rd.date,
        platform: rd.platform?.name,
      })),
    };
  }

  async generateImage(
    input: GenerateImageInput,
  ): Promise<{ success: boolean; url: string; data: Game } | null> {
    const {
      igdbId,
      includeStoryline,
      includeGenres,
      includeThemes,
      artStyle: artStyleValue, // effectively artStyleValue, not renaming this to be consistent with bulkImageGenJobs
    } = input;
    const game = await this.gamesService.getGameByIgdbId(igdbId);
    const artStyles = await this.databaseService.db
      .select()
      .from(artStylesView);

    if (!game || !artStyleValue) {
      return null;
    }

    const artStyleDescription = artStyles.find(
      (artStyle) =>
        artStyle.value.toLowerCase() === artStyleValue.toLowerCase(),
    )?.description;
    const prompt = this.buildImagePrompt(
      game,
      {
        includeStoryline: includeStoryline ?? false,
        includeGenres: includeGenres ?? false,
        includeThemes: includeThemes ?? false,
      },
      artStyleDescription!,
    );
    const rawBuffer = await this.aiService.generateImage(prompt);
    const imageBuffer = await sharp(rawBuffer).jpeg({ quality: 85 }).toBuffer();
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
    const newItem = {
      [artStyleValue]: {
        url: publicUrl,
        prompt: prompt,
        provider: 'cloudflare',
      },
    };
    const existingIndex = list.findIndex(
      (item: any) => item && typeof item === 'object' && artStyleValue in item,
    );

    if (existingIndex >= 0) {
      list[existingIndex] = newItem;
    } else {
      list.push(newItem);
    }

    const updatedGame = await this.gamesService.updateGame(game.id, {
      aiImageUrl: publicUrl,
      aiPrompt: prompt,
      imageGen: list,
    });

    if (!updatedGame) {
      throw new NotFoundException('Failed to update game record');
    }

    return { success: true, url: publicUrl, data: updatedGame };
  }

  private buildImagePrompt(
    game: Pick<
      Game,
      'name' | 'summary' | 'storyline' | 'keywords' | 'genres' | 'themes'
    >,
    options: {
      includeStoryline: boolean;
      includeGenres: boolean;
      includeThemes: boolean;
    },
    artStyleDescription: string,
  ): string {
    const parts: string[] = [];

    parts.push(
      `${artStyleDescription} of iconic characters from "${game.name}" set within the game's distinct world`,
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
