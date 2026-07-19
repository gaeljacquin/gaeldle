import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { eq, sql, desc, and } from 'drizzle-orm';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '@/db/database.service';
import {
  games,
  domainEvents,
  type Game,
  gameObject,
  artStyles as artStylesView,
  type ArtStyleValue,
  ImageGenStatus,
} from '@workspace/api-contract';
import { AiService } from '@/lib/ai.service';
import { S3Service } from '@/lib/s3.service';
import { R2Service } from '@/lib/r2.service';
import { ImageGenStore } from '@/image-gen/image-gen.store';
import { IMAGE_GEN_DIR, IMAGE_PROMPT_SUFFIX } from '@workspace/shared';
import { GamesService } from '@/games/games.service';
import { SqsService } from '@/lib/sqs.service';
import configuration from '@/config/configuration';

interface GenerateImageInput {
  igdbId: number;
  includeStoryline?: boolean;
  includeGenres?: boolean;
  includeThemes?: boolean;
  artStyle?: ArtStyleValue;
  provider: string;
}

@Injectable()
export class ImageGenService {
  constructor(
    private readonly gamesService: GamesService,
    private readonly databaseService: DatabaseService,
    private readonly aiService: AiService,
    private readonly s3Service: S3Service,
    private readonly imageGenStore: ImageGenStore,
    private readonly r2Service: R2Service,
    private readonly sqsService: SqsService,
  ) {}

  async generateImages(
    params: {
      numGames: number;
      artStyle: ArtStyleValue; // effectively artStyleValue, not renaming this to be consistent with imageGen
      includeStoryline: boolean;
      includeGenres: boolean;
      includeThemes: boolean;
      provider: string;
    },
    actorId: string,
  ): Promise<{ imageGenId: string; gamesQueued: number }> {
    // Check if an image generation process is already active
    const [latestStarted] = await this.databaseService.db
      .select()
      .from(domainEvents)
      .where(eq(domainEvents.eventType, 'image_gen.started'))
      .orderBy(desc(domainEvents.occurredAt))
      .limit(1);

    if (latestStarted) {
      const payload = latestStarted.payload as { imageGenId: string };
      const [finished] = await this.databaseService.db
        .select()
        .from(domainEvents)
        .where(
          and(
            eq(domainEvents.eventType, 'image_gen.finished'),
            sql`${domainEvents.payload}->>'imageGenId' = ${payload.imageGenId}`,
          ),
        )
        .limit(1);

      if (!finished) {
        throw new ConflictException(
          'An image generation is already active. Please wait for it to finish.',
        );
      }
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

    const imageGenId = randomUUID();

    // Insert the started domain event
    await this.databaseService.db.insert(domainEvents).values({
      eventType: 'image_gen.started',
      actorId,
      payload: {
        imageGenId,
        total,
        params,
      },
    });

    // Run the generation loop asynchronously (fire-and-forget)
    this.runGenerationLoop(imageGenId, pendingGames, params, actorId).catch(
      (err) => {
        console.error(
          `[ImageGen] Fatal error for generation ${imageGenId}:`,
          err,
        );
      },
    );

    return { imageGenId, gamesQueued: total };
  }

  private async runGenerationLoop(
    imageGenId: string,
    pendingGames: Game[],
    params: {
      numGames: number;
      artStyle: ArtStyleValue; // effectively artStyleValue, not renaming this to be consistent with imageGen
      includeStoryline: boolean;
      includeGenres: boolean;
      includeThemes: boolean;
      provider: string;
    },
    actorId: string,
  ): Promise<void> {
    const total = pendingGames.length;
    const failures: Array<{ igdbId: number; gameName: string; error: string }> =
      [];
    const { artStyle: artStyleValue, provider } = params;
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    // Set initial progress in the in-memory store
    this.imageGenStore.setProgress(imageGenId, {
      processed,
      succeeded,
      failed,
      failures,
    });

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

    for (const game of pendingGames) {
      try {
        const prompt = this.buildImagePrompt(
          game,
          params,
          artStyle?.description,
        );
        const rawBuffer = await this.aiService.generateImage(prompt, provider);
        const imageBuffer = await sharp(rawBuffer)
          .jpeg({ quality: 85 })
          .toBuffer();
        const timestamp = Date.now();
        const key = `${IMAGE_GEN_DIR}/${game.igdbId}_${timestamp}.jpg`;

        await this.s3Service.uploadImage(key, imageBuffer, 'image/jpeg');

        const publicUrl = `${this.r2Service.r2PublicUrl}/${key}`;
        const list = Array.isArray(game.imageGen)
          ? JSON.parse(JSON.stringify(game.imageGen))
          : [];
        const asvKey = artStyleValue;
        const newItem = {
          [asvKey]: {
            url: publicUrl,
            prompt,
            provider,
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
          `[ImageGen] Failed to process game ${game.name} (${game.igdbId}):`,
          errorMessage,
        );
      }

      processed++;

      // Update progress in the store
      this.imageGenStore.setProgress(imageGenId, {
        processed,
        succeeded,
        failed,
        failures,
      });

      this.imageGenStore.emit(imageGenId, {
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

    // Insert finished domain event
    await this.databaseService.db.insert(domainEvents).values({
      eventType: 'image_gen.finished',
      actorId,
      payload: {
        imageGenId,
        status: finalStatus,
        total,
        processed,
        succeeded,
        failed,
        failures,
      },
    });

    this.imageGenStore.emit(imageGenId, {
      type: 'completed',
      data: { succeeded, failed, failures },
    });

    // Clean up store for this generation
    this.imageGenStore.destroy(imageGenId);

    await this.gamesService.refreshAllGamesView();
  }

  async getImageGenStatus(imageGenId: string) {
    const [startedEvent] = await this.databaseService.db
      .select()
      .from(domainEvents)
      .where(
        and(
          eq(domainEvents.eventType, 'image_gen.started'),
          sql`${domainEvents.payload}->>'imageGenId' = ${imageGenId}`,
        ),
      )
      .limit(1);

    if (!startedEvent) {
      throw new NotFoundException(`Image generation ${imageGenId} not found`);
    }

    const startPayload = startedEvent.payload as {
      imageGenId: string;
      total: number;
      params: any;
    };

    const [finishedEvent] = await this.databaseService.db
      .select()
      .from(domainEvents)
      .where(
        and(
          eq(domainEvents.eventType, 'image_gen.finished'),
          sql`${domainEvents.payload}->>'imageGenId' = ${imageGenId}`,
        ),
      )
      .limit(1);

    if (finishedEvent) {
      const finishPayload = finishedEvent.payload as {
        status: 'completed' | 'failed';
        total: number;
        processed: number;
        succeeded: number;
        failed: number;
        failures: Array<{ igdbId: number; gameName: string; error: string }>;
      };

      return {
        imageGenId,
        status: finishPayload.status as ImageGenStatus,
        total: finishPayload.total,
        processed: finishPayload.processed,
        succeeded: finishPayload.succeeded,
        failed: finishPayload.failed,
        failures: (finishPayload.failures ?? []) as Array<{
          igdbId: number;
          gameName: string;
          error: string;
        }>,
        params: startPayload.params,
        startedAt: startedEvent.occurredAt,
        completedAt: finishedEvent.occurredAt,
        createdAt: startedEvent.occurredAt!,
      };
    }

    // Check if it's currently running in memory
    const activeProgress = this.imageGenStore.getProgress(imageGenId);

    if (activeProgress) {
      return {
        imageGenId,
        status: 'running' as ImageGenStatus,
        total: startPayload.total,
        processed: activeProgress.processed,
        succeeded: activeProgress.succeeded,
        failed: activeProgress.failed,
        failures: activeProgress.failures,
        params: startPayload.params,
        startedAt: startedEvent.occurredAt,
        completedAt: null,
        createdAt: startedEvent.occurredAt!,
      };
    }

    // Fallback: If not running in memory and no finished event, treat as failed/stopped
    return {
      imageGenId,
      status: 'failed' as ImageGenStatus,
      total: startPayload.total,
      processed: startPayload.total,
      succeeded: 0,
      failed: startPayload.total,
      failures: [
        {
          igdbId: 0,
          gameName: 'All games',
          error: 'Generation stopped or server restarted',
        },
      ],
      params: startPayload.params,
      startedAt: startedEvent.occurredAt,
      completedAt: startedEvent.occurredAt,
      createdAt: startedEvent.occurredAt!,
    };
  }

  async generateImage(
    input: GenerateImageInput,
    actorId: string,
  ): Promise<{ success: boolean; messageId?: string } | null> {
    const { igdbId } = input;
    const game = await this.gamesService.getGameByIgdbId(igdbId);

    if (!game) {
      return null;
    }

    const queueUrl = configuration().imageGenSqsQueueUrl;
    const res = await this.sqsService.sendMessage(queueUrl, {
      type: 'image-gen',
      input,
      actorId,
    });

    if (!res.ok) {
      throw new Error('Failed to send image generation job to SQS queue');
    }

    // Insert the queued domain event
    await this.databaseService.db.insert(domainEvents).values({
      eventType: 'image_gen.queued',
      actorId,
      payload: {
        igdbId,
        artStyle: input.artStyle,
        messageId: res.MessageId,
        queueUrl,
      },
    });

    return { success: true, messageId: res.MessageId };
  }

  async runSingleGeneration(
    input: GenerateImageInput,
    actorId: string,
  ): Promise<{ success: boolean; url: string; data: Game } | null> {
    const {
      igdbId,
      includeStoryline,
      includeGenres,
      includeThemes,
      artStyle: artStyleValue,
      provider,
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

    const rawBuffer = await this.aiService.generateImage(prompt, provider);
    const imageBuffer = await sharp(rawBuffer).jpeg({ quality: 85 }).toBuffer();
    const timestamp = Date.now();
    const key = `${IMAGE_GEN_DIR}/${igdbId}_${timestamp}.jpg`;

    await this.s3Service.uploadImage(key, imageBuffer, 'image/jpeg');

    const publicUrl = `${this.r2Service.r2PublicUrl}/${key}`;
    const list = Array.isArray(game.imageGen)
      ? JSON.parse(JSON.stringify(game.imageGen))
      : [];
    const newItem = {
      [artStyleValue]: {
        url: publicUrl,
        prompt: prompt,
        provider,
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

    // Insert the domain event for single image generation
    await this.databaseService.db.insert(domainEvents).values({
      eventType: 'image_gen.generated',
      actorId,
      payload: {
        igdbId,
        gameId: game.id,
        url: publicUrl,
        prompt,
        artStyle: artStyleValue,
        params: {
          includeStoryline: includeStoryline ?? false,
          includeGenres: includeGenres ?? false,
          includeThemes: includeThemes ?? false,
        },
      },
    });

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
