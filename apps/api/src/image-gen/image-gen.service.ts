import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { eq, sql, and, isNull } from 'drizzle-orm';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '@/db/database.service';
import {
  games,
  domainEvents,
  type Game,
  artStyles as artStylesView,
  type ArtStyleValue,
  imageGenBatches,
  singleImageGenJobs,
} from '@workspace/db';
import type { ImageGenStatus } from '@workspace/db';
import { AiService } from '@/lib/ai.service';
import { S3Service } from '@/lib/s3.service';
import { R2Service } from '@/lib/r2.service';
import { IMAGE_GEN_DIR } from '@workspace/shared';
import { GamesService } from '@/games/games.service';
import configuration from '@/config/configuration';
import { QueueClient } from '@workspace/queue';

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
    private readonly r2Service: R2Service,
  ) {}

  async generateImages(
    params: {
      numGames: number;
      artStyle: string;
      includeStoryline?: boolean;
      includeGenres?: boolean;
      includeThemes?: boolean;
      provider: string;
    },
    actorId: string,
  ): Promise<{ imageGenId: string; gamesQueued: number }> {
    // Select jobs before publishing so the worker can recover from API restarts.
    const pendingGames = await this.databaseService.db
      .select({ igdbId: games.igdbId })
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

    const input = {
      includeStoryline: params.includeStoryline,
      includeGenres: params.includeGenres,
      includeThemes: params.includeThemes,
      artStyle: params.artStyle,
      provider: params.provider,
    };

    const jobs = pendingGames.map((game) => ({
      jobId: randomUUID(),
      batchId: imageGenId,
      actorId,
      igdbId: game.igdbId,
      artStyle: input.artStyle,
      provider: input.provider,
      input: { ...input, igdbId: game.igdbId },
    }));

    await this.databaseService.db.transaction(async (tx) => {
      await tx.insert(imageGenBatches).values({
        batchId: imageGenId,
        actorId,
        params: input,
        total,
      });
      await tx.insert(singleImageGenJobs).values(jobs);
    });

    await this.dispatchPendingJobs();

    return { imageGenId, gamesQueued: total };
  }

  async getImageGenStatus(imageGenId: string, actorId: string) {
    const [batch] = await this.databaseService.db
      .select()
      .from(imageGenBatches)
      .where(
        and(
          eq(imageGenBatches.batchId, imageGenId),
          eq(imageGenBatches.actorId, actorId),
        ),
      )
      .limit(1);

    if (!batch) {
      throw new NotFoundException(`Image generation ${imageGenId} not found`);
    }
    const jobs = await this.databaseService.db
      .select()
      .from(singleImageGenJobs)
      .where(eq(singleImageGenJobs.batchId, imageGenId));
    const succeeded = jobs.filter((job) => job.status === 'completed').length;
    const failedJobs = jobs.filter((job) => job.status === 'failed');
    const failed = failedJobs.length;
    const processed = succeeded + failed;
    const status: ImageGenStatus =
      processed === 0
        ? 'pending'
        : processed < batch.total
          ? 'running'
          : failed === batch.total
            ? 'failed'
            : 'completed';

    return {
      imageGenId,
      status,
      total: batch.total,
      processed,
      succeeded,
      failed,
      failures: failedJobs.map((job) => ({
        igdbId: job.igdbId,
        gameName: String(job.igdbId),
        error: job.error ?? 'Image generation failed',
      })),
      params: batch.params,
      startedAt: batch.startedAt,
      completedAt:
        status === 'completed' || status === 'failed' ? new Date() : null,
      createdAt: batch.createdAt,
    };
  }

  async generateImage(
    input: GenerateImageInput,
    actorId: string,
  ): Promise<{ success: boolean; jobId: string; messageId?: string } | null> {
    const { igdbId } = input;
    const game = await this.gamesService.getGameByIgdbId(igdbId);

    if (!game) {
      return null;
    }

    const queueUrl = configuration().imageGenSqsQueueUrl;
    if (!queueUrl) {
      throw new Error('IMAGE_GEN_SQS_QUEUE_URL is required');
    }

    const jobId = randomUUID();

    await this.databaseService.db.insert(singleImageGenJobs).values({
      jobId,
      actorId,
      igdbId,
      artStyle: input.artStyle,
      provider: input.provider,
      input,
    });

    let res: { MessageId?: string };

    try {
      res = await this.createQueueClient().publishImageGeneration(
        queueUrl,
        jobId,
      );
    } catch (err) {
      await this.failSingleImageGenJob(
        jobId,
        err instanceof Error ? err.message : String(err),
        true,
      );
      throw err;
    }

    await this.databaseService.db
      .update(singleImageGenJobs)
      .set({ sqsMessageId: res.MessageId })
      .where(eq(singleImageGenJobs.jobId, jobId));

    // Insert the queued domain event
    await this.databaseService.db.insert(domainEvents).values({
      eventType: 'image_gen.queued',
      actorId,
      payload: {
        igdbId,
        jobId,
        artStyle: input.artStyle,
        messageId: res.MessageId,
        queueUrl,
      },
    });

    return { success: true, jobId, messageId: res.MessageId };
  }

  async getSingleImageGenStatus(jobId: string, actorId: string) {
    const [job] = await this.databaseService.db
      .select()
      .from(singleImageGenJobs)
      .where(
        and(
          eq(singleImageGenJobs.jobId, jobId),
          eq(singleImageGenJobs.actorId, actorId),
        ),
      )
      .limit(1);

    if (!job) {
      throw new NotFoundException(`Image generation ${jobId} not found`);
    }

    return job;
  }

  async getWorkerInput(jobId: string) {
    const [job] = await this.databaseService.db
      .select({
        input: singleImageGenJobs.input,
        actorId: singleImageGenJobs.actorId,
      })
      .from(singleImageGenJobs)
      .where(eq(singleImageGenJobs.jobId, jobId))
      .limit(1);

    if (!job?.input) {
      throw new NotFoundException(`Image generation ${jobId} has no input`);
    }

    return { input: job.input as GenerateImageInput, actorId: job.actorId };
  }

  async dispatchPendingJobs(): Promise<void> {
    const jobs = await this.databaseService.db
      .select({ jobId: singleImageGenJobs.jobId })
      .from(singleImageGenJobs)
      .where(
        and(
          eq(singleImageGenJobs.status, 'pending'),
          isNull(singleImageGenJobs.sqsMessageId),
        ),
      )
      .limit(100);
    const queue = this.createQueueClient();
    const queueUrl = configuration().imageGenSqsQueueUrl;
    if (!queueUrl) {
      throw new Error('IMAGE_GEN_SQS_QUEUE_URL is required');
    }

    for (const job of jobs) {
      const message = await queue.publishImageGeneration(queueUrl, job.jobId);
      await this.databaseService.db
        .update(singleImageGenJobs)
        .set({ sqsMessageId: message.MessageId })
        .where(eq(singleImageGenJobs.jobId, job.jobId));
    }
  }

  async startSingleImageGenJob(jobId: string): Promise<boolean> {
    const [existingJob] = await this.databaseService.db
      .select({ status: singleImageGenJobs.status })
      .from(singleImageGenJobs)
      .where(eq(singleImageGenJobs.jobId, jobId))
      .limit(1);

    if (!existingJob) {
      throw new NotFoundException(`Image generation ${jobId} not found`);
    }

    if (existingJob.status === 'completed' || existingJob.status === 'failed') {
      return false;
    }

    const [job] = await this.databaseService.db
      .update(singleImageGenJobs)
      .set({
        status: 'running',
        attempts: sql`${singleImageGenJobs.attempts} + 1`,
        startedAt: sql`COALESCE(${singleImageGenJobs.startedAt}, NOW())`,
        error: null,
      })
      .where(
        and(
          eq(singleImageGenJobs.jobId, jobId),
          eq(singleImageGenJobs.status, 'pending'),
        ),
      )
      .returning({ jobId: singleImageGenJobs.jobId });

    return Boolean(job);
  }

  async completeSingleImageGenJob(
    jobId: string,
    resultUrl: string,
  ): Promise<void> {
    await this.databaseService.db
      .update(singleImageGenJobs)
      .set({
        status: 'completed',
        resultUrl,
        error: null,
        completedAt: new Date(),
      })
      .where(eq(singleImageGenJobs.jobId, jobId));
  }

  async retryOrFailSingleImageGenJob(
    jobId: string,
    error: string,
  ): Promise<{ shouldRetry: boolean }> {
    const [job] = await this.databaseService.db
      .select({
        attempts: singleImageGenJobs.attempts,
        maxAttempts: singleImageGenJobs.maxAttempts,
      })
      .from(singleImageGenJobs)
      .where(eq(singleImageGenJobs.jobId, jobId))
      .limit(1);

    if (!job) {
      throw new NotFoundException(`Image generation ${jobId} not found`);
    }

    const shouldRetry = job.attempts < job.maxAttempts;
    await this.failSingleImageGenJob(jobId, error, !shouldRetry);

    return { shouldRetry };
  }

  private async failSingleImageGenJob(
    jobId: string,
    error: string,
    terminal: boolean,
  ): Promise<void> {
    await this.databaseService.db
      .update(singleImageGenJobs)
      .set({
        status: terminal ? 'failed' : 'pending',
        error,
        completedAt: terminal ? new Date() : null,
      })
      .where(eq(singleImageGenJobs.jobId, jobId));
  }

  async runSingleGeneration(
    input: GenerateImageInput,
    actorId: string,
    jobId?: string,
  ): Promise<{ success: boolean; url: string; data: Game }> {
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

    if (!game) {
      throw new NotFoundException(`Game with igdbId ${igdbId} not found`);
    }

    if (!artStyleValue) {
      throw new Error('An art style is required to generate an image');
    }

    const artStyleDescription = artStyles.find(
      (artStyle) =>
        artStyle.value.toLowerCase() === artStyleValue.toLowerCase(),
    )?.description;

    if (!artStyleDescription) {
      throw new Error(`No art style description found for ${artStyleValue}`);
    }
    const prompt = this.buildImagePrompt(
      game,
      {
        includeStoryline: includeStoryline ?? false,
        includeGenres: includeGenres ?? false,
        includeThemes: includeThemes ?? false,
      },
      artStyleDescription,
    );

    const rawBuffer = await this.aiService.generateImage(prompt, provider);
    const imageBuffer = await sharp(rawBuffer).jpeg({ quality: 85 }).toBuffer();
    const timestamp = Date.now();
    const key = `${IMAGE_GEN_DIR}/${igdbId}_${timestamp}.jpg`;

    await this.s3Service.uploadImage(key, imageBuffer, 'image/jpeg');

    const publicUrl = `${this.r2Service.r2PublicUrl}/${key}`;
    const list = game.imageGen ? [...game.imageGen] : [];
    const newItem = {
      [artStyleValue]: {
        url: publicUrl,
        prompt: prompt,
        provider,
      },
    };
    const existingIndex = list.findIndex(
      (item) =>
        item &&
        typeof item === 'object' &&
        Object.keys(item).some(
          (k) => k.toLowerCase() === artStyleValue.toLowerCase(),
        ),
    );

    let replacedImageUrl: string | null = null;

    if (existingIndex >= 0) {
      const matchedKey = Object.keys(list[existingIndex]).find(
        (k) => k.toLowerCase() === artStyleValue.toLowerCase(),
      )!;
      replacedImageUrl = list[existingIndex][matchedKey]?.url ?? null;
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

    // Delete the replaced image from Cloudflare R2 bucket only after new image is generated and saved
    if (replacedImageUrl) {
      await this.deleteR2ImageByUrl(replacedImageUrl, igdbId);
    }

    // Insert the domain event for single image generation
    await this.databaseService.db.insert(domainEvents).values({
      eventType: 'image_gen.generated',
      actorId,
      payload: {
        jobId,
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

  async deleteGeneratedImage(
    dto: { igdbId: number; artStyle: string },
    actorId: string,
  ): Promise<{ success: boolean; data: Game } | null> {
    const { igdbId, artStyle: artStyleValue } = dto;
    const game = await this.gamesService.getGameByIgdbId(igdbId);

    if (!game) {
      throw new NotFoundException(`Game with igdbId ${igdbId} not found`);
    }

    const list = (game.imageGen ?? []) as Array<
      Record<string, { url: string; prompt: string; provider: string }>
    >;
    const entryIndex = list.findIndex(
      (item) =>
        item &&
        typeof item === 'object' &&
        Object.keys(item).some(
          (k) => k.toLowerCase() === artStyleValue.toLowerCase(),
        ),
    );

    if (entryIndex < 0) {
      throw new NotFoundException(
        `Generated image for art style "${artStyleValue}" not found for game ${igdbId}`,
      );
    }

    const matchedKey = Object.keys(list[entryIndex]).find(
      (k) => k.toLowerCase() === artStyleValue.toLowerCase(),
    )!;
    const entry = list[entryIndex][matchedKey];
    const imageUrl = entry?.url;

    if (imageUrl) {
      await this.deleteR2ImageByUrl(imageUrl, igdbId);
    }

    const updatedList = list.filter((_, idx) => idx !== entryIndex);

    let newAiImageUrl = game.aiImageUrl;
    let newAiPrompt = game.aiPrompt;

    if (game.aiImageUrl === imageUrl) {
      if (updatedList.length > 0) {
        const firstRemainingKey = Object.keys(updatedList[0])[0];
        const firstRemaining = updatedList[0][firstRemainingKey];
        newAiImageUrl = firstRemaining.url;
        newAiPrompt = firstRemaining.prompt;
      } else {
        newAiImageUrl = null;
        newAiPrompt = null;
      }
    }

    const updatedGame = await this.gamesService.updateGame(game.id, {
      imageGen: updatedList,
      aiImageUrl: newAiImageUrl,
      aiPrompt: newAiPrompt,
    });

    if (!updatedGame) {
      throw new NotFoundException('Failed to update game record');
    }

    await this.databaseService.db.insert(domainEvents).values({
      eventType: 'image_gen.deleted',
      actorId,
      payload: {
        igdbId,
        gameId: game.id,
        url: imageUrl,
        artStyle: artStyleValue,
      },
    });

    return { success: true, data: updatedGame };
  }

  private buildImagePrompt(
    game: Pick<
      Game,
      'name' | 'summary' | 'storyline' | 'keywords' | 'genres' | 'themes'
    >,
    options: {
      includeStoryline?: boolean;
      includeGenres?: boolean;
      includeThemes?: boolean;
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

    if (options.includeGenres && (game.genres as string[])?.length > 0) {
      parts.push(`Genre: ${(game.genres as string[]).join(', ')}`);
    }

    if (options.includeThemes && (game.themes as string[])?.length > 0) {
      parts.push(`Themes: ${(game.themes as string[]).join(', ')}`);
    }

    if ((game.keywords as string[])?.length > 0) {
      parts.push(`Keywords: ${(game.keywords as string[]).join(', ')}`);
    }

    return parts.join('. ');
  }

  private async deleteR2ImageByUrl(
    imageUrl: string,
    igdbId?: number,
  ): Promise<void> {
    if (!imageUrl) return;
    try {
      let key = imageUrl;
      if (
        this.r2Service.r2PublicUrl &&
        imageUrl.startsWith(this.r2Service.r2PublicUrl)
      ) {
        key = imageUrl
          .slice(this.r2Service.r2PublicUrl.length)
          .replace(/^\/+/, '');
      } else {
        try {
          const urlObj = new URL(imageUrl);
          key = urlObj.pathname.replace(/^\/+/, '');
        } catch {
          key = imageUrl.replace(/^\/+/, '');
        }
      }
      key = decodeURIComponent(key);
      await this.s3Service.deleteFile(key);
    } catch (err) {
      if (igdbId) {
        console.error(
          'Failed to delete image file from R2 for igdbId %s:',
          igdbId,
          err,
        );
      } else {
        console.error('Failed to delete image file from R2:', err);
      }
    }
  }

  private createQueueClient(): QueueClient {
    const config = configuration();
    return new QueueClient({
      region: config.awsRegion || 'us-east-1',
      accessKeyId: config.awsAccessKeyId || undefined,
      secretAccessKey: config.awsSecretAccessKey || undefined,
    });
  }
}
