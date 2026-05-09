import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { eq, inArray, sql, InferInsertModel } from 'drizzle-orm';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '@/db/database.service';
import {
  games,
  bulkImageGenJobs,
  type Game,
  gameObject,
  type SyncOperation,
  GameUpdate,
  type ImageStyle,
} from '@workspace/api-contract';
import { IgdbService, type IgdbGame } from '@/games/igdb.service';
import { AiService } from '@/lib/ai.service';
import { S3Service } from '@/lib/s3.service';
import { BulkImageJobStore } from '@/games/bulk-image-job.store';
import type { AppConfiguration } from '@/config/configuration';
import {
  IMAGE_STYLES,
  IMAGE_PROMPT_SUFFIX,
  IMAGE_GEN_DIR,
} from '@workspace/constants';

type Result = {
  current: number;
  replacement: number;
  status: 'updated' | 'skipped' | 'error';
  message: string;
  gameName: string | null;
};

type GameInsert = InferInsertModel<typeof games>;

@Injectable()
export class GamesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly igdbService: IgdbService,
    private readonly aiService: AiService,
    private readonly s3Service: S3Service,
    private readonly bulkImageJobStore: BulkImageJobStore,
    private readonly configService: ConfigService<AppConfiguration>,
  ) {}

  // Kept for internal use by generateImage in the router (not exposed as a standalone endpoint).
  async getGameByIgdbId(igdbId: number): Promise<Game | null> {
    const [game] = await this.databaseService.db
      .select(gameObject)
      .from(games)
      .where(eq(games.igdbId, igdbId))
      .limit(1);

    return game || null;
  }

  async refreshAllGamesView() {
    try {
      await this.databaseService.db.execute(
        sql`REFRESH MATERIALIZED VIEW all_games`,
      );
    } catch (e) {
      console.error('Failed to refresh materialized view', e);
    }
  }

  async syncGameByIgdbId(igdbId: number): Promise<{
    game: Game;
    operation: SyncOperation;
  } | null> {
    const igdbGame = await this.igdbService.getGameById(igdbId);

    if (!igdbGame) {
      return null;
    }

    const gameData = this.mapIgdbToGame(igdbGame);

    const [existingGame] = await this.databaseService.db
      .select()
      .from(games)
      .where(eq(games.igdbId, igdbId))
      .limit(1);

    if (existingGame) {
      const [updatedGame] = await this.databaseService.db
        .update(games)
        .set({
          ...gameData,
          updatedAt: new Date(),
        })
        .where(eq(games.igdbId, igdbId))
        .returning();

      await this.refreshAllGamesView();

      return {
        game: updatedGame as unknown as Game,
        operation: 'updated',
      };
    }

    const [newGame] = await this.databaseService.db
      .insert(games)
      .values(gameData)
      .returning();

    await this.refreshAllGamesView();

    return {
      game: newGame as unknown as Game,
      operation: 'created',
    };
  }

  async updateGame(id: number, updates: GameUpdate): Promise<Game | null> {
    const [updatedGame] = await this.databaseService.db
      .update(games)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(games.id, id))
      .returning();

    if (updatedGame) {
      await this.refreshAllGamesView();
    }

    return updatedGame || null;
  }

  async deleteGame(id: number): Promise<number | null> {
    const [deletedGame] = await this.databaseService.db
      .delete(games)
      .where(eq(games.id, id))
      .returning({ id: games.id });

    if (deletedGame) {
      await this.refreshAllGamesView();
    }

    return deletedGame?.id ?? null;
  }

  async deleteGames(ids: number[]): Promise<number[]> {
    const deletedRows = await this.databaseService.db
      .delete(games)
      .where(inArray(games.id, ids))
      .returning({ id: games.id });

    if (deletedRows.length > 0) {
      await this.refreshAllGamesView();
    }

    return deletedRows.map((row) => row.id);
  }

  // ─── Add Game by IGDB ID ─────────────────────────────────────────────────────────────

  async validateGameForAdd(igdbId: number): Promise<{
    igdbId: number;
    existsOnIgdb: boolean;
    alreadyInDb: boolean;
    gameName: string | null;
    canAdd: boolean;
  }> {
    const [existingRow] = await this.databaseService.db
      .select({ id: games.id, name: games.name })
      .from(games)
      .where(eq(games.igdbId, igdbId))
      .limit(1);

    if (existingRow) {
      return {
        igdbId,
        existsOnIgdb: true,
        alreadyInDb: true,
        gameName: existingRow.name ?? null,
        canAdd: false,
      };
    }

    try {
      const igdbGame = await this.igdbService.getGameById(igdbId);

      if (!igdbGame) {
        return {
          igdbId,
          existsOnIgdb: false,
          alreadyInDb: false,
          gameName: null,
          canAdd: false,
        };
      }

      return {
        igdbId,
        existsOnIgdb: true,
        alreadyInDb: false,
        gameName: igdbGame.name ?? null,
        canAdd: true,
      };
    } catch {
      return {
        igdbId,
        existsOnIgdb: false,
        alreadyInDb: false,
        gameName: null,
        canAdd: false,
      };
    }
  }

  // ─── Replace Game by IGDB ID ──────────────────────────────────────────────────────────

  async validateGameByIgdbId(
    current: number,
    replacement: number,
  ): Promise<{
    current: number;
    replacement: number;
    currentExistsInDb: boolean;
    replacementExistsOnIgdb: boolean;
    replacementAlreadyInDb: boolean;
    replacementGameName: string | null;
    canApply: boolean;
    currentGameName: string | null;
  }> {
    const [currentRow] = await this.databaseService.db
      .select({ id: games.id, name: games.name })
      .from(games)
      .where(eq(games.igdbId, current))
      .limit(1);

    const currentExistsInDb = !!currentRow;
    const currentGameName = currentRow?.name ?? null;

    let replacementAlreadyInDb = false;
    let replacementExistsOnIgdb = false;
    let replacementGameName: string | null = null;

    if (currentExistsInDb) {
      const [replacementRow] = await this.databaseService.db
        .select({ id: games.id })
        .from(games)
        .where(eq(games.igdbId, replacement))
        .limit(1);

      replacementAlreadyInDb = !!replacementRow;

      try {
        const igdbGame = await this.igdbService.getGameById(replacement);
        if (igdbGame) {
          replacementExistsOnIgdb = true;
          replacementGameName = igdbGame.name ?? null;
        }
      } catch {
        replacementExistsOnIgdb = false;
      }
    }

    const canApply =
      currentExistsInDb &&
      replacementExistsOnIgdb &&
      !replacementAlreadyInDb &&
      current !== replacement;

    return {
      current,
      replacement,
      currentExistsInDb,
      currentGameName,
      replacementExistsOnIgdb,
      replacementAlreadyInDb,
      replacementGameName,
      canApply,
    };
  }

  // Helper: build a skipped/error result inline (replaces repeated result.push blocks)
  private makeResult(
    pair: { current: number; replacement: number },
    status: 'skipped' | 'error',
    message: string,
  ): Result {
    return { ...pair, status, message, gameName: null };
  }

  // Helper: separate valid pairs from immediately-skippable ones
  private partitionPairs(
    pairs: Array<{ current: number; replacement: number }>,
    existingReplacementSet: Set<number>,
  ): { validPairs: typeof pairs; skippedResults: Result[] } {
    const validPairs: typeof pairs = [];
    const skippedResults: Result[] = [];

    for (const pair of pairs) {
      if (pair.current === pair.replacement) {
        skippedResults.push(
          this.makeResult(
            pair,
            'skipped',
            'Current and replacement IGDB IDs are the same',
          ),
        );
      } else if (existingReplacementSet.has(pair.replacement)) {
        skippedResults.push(
          this.makeResult(
            pair,
            'skipped',
            'Replacement IGDB ID already exists in the database',
          ),
        );
      } else {
        validPairs.push(pair);
      }
    }

    return { validPairs, skippedResults };
  }

  // Helper: fetch IGDB data or return error results for all pairs
  private async fetchIgdbGameMap(
    validPairs: Array<{ current: number; replacement: number }>,
  ): Promise<{ igdbGameMap: Map<number, GameInsert> } | Result[]> {
    const replacementIds = validPairs.map((p) => p.replacement);
    try {
      const igdbGames = await this.igdbService.getGamesByIds(replacementIds);
      return {
        igdbGameMap: new Map(
          igdbGames.map((g) => [g.id, this.mapIgdbToGame(g)]),
        ),
      };
    } catch (err) {
      const message =
        err instanceof Error
          ? `IGDB fetch failed: ${err.message}`
          : 'IGDB fetch failed';
      return validPairs.map((pair) => this.makeResult(pair, 'error', message));
    }
  }

  private async updateGameHelper(
    gameData: GameInsert,
    pair: { current: number; replacement: number },
    results: Result[],
  ): Promise<boolean> {
    const updated = await this.databaseService.db
      .update(games)
      .set({ ...gameData, updatedAt: new Date() })
      .where(eq(games.igdbId, pair.current))
      .returning({ igdbId: games.igdbId, name: games.name });

    if (updated.length === 0) {
      results.push(
        this.makeResult(
          pair,
          'skipped',
          `No row found with igdb_id=${pair.current}`,
        ),
      );
      return false;
    }

    results.push({
      ...pair,
      status: 'updated',
      message: `Updated IGDB ID ${pair.current} → ${pair.replacement}`,
      gameName: updated[0].name ?? null,
    });
    return true;
  }

  async replaceGameByIgdbId(
    pairs: Array<{ current: number; replacement: number }>,
  ): Promise<{ success: boolean; results: Array<Result> }> {
    // Check which replacement IDs already exist in DB
    const allReplacementIds = pairs.map((p) => p.replacement);
    const existingReplacements = await this.databaseService.db
      .select({ igdbId: games.igdbId })
      .from(games)
      .where(inArray(games.igdbId, allReplacementIds));

    const existingReplacementSet = new Set(
      existingReplacements.map((r) => r.igdbId),
    );
    const { validPairs, skippedResults } = this.partitionPairs(
      pairs,
      existingReplacementSet,
    );
    const results: Array<Result> = [...skippedResults];

    if (validPairs.length === 0) return { success: true, results };

    // Fetch from IGDB — returns map on success, error results on failure
    const igdbResult = await this.fetchIgdbGameMap(validPairs);
    if (Array.isArray(igdbResult))
      return { success: false, results: [...results, ...igdbResult] };

    const { igdbGameMap } = igdbResult;
    let anyUpdated = false;

    for (const pair of validPairs) {
      const gameData = igdbGameMap.get(pair.replacement);
      if (!gameData) {
        results.push(
          this.makeResult(
            pair,
            'skipped',
            `No data returned from IGDB for IGDB ID ${pair.replacement}`,
          ),
        );
        continue;
      }
      try {
        anyUpdated = await this.updateGameHelper(gameData, pair, results);
      } catch (err) {
        results.push(
          this.makeResult(
            pair,
            'error',
            err instanceof Error ? err.message : 'Database update failed',
          ),
        );
      }
    }

    if (anyUpdated) await this.refreshAllGamesView();
    return { success: true, results };
  }

  // ─── Bulk Image Generation ─────────────────────────────────────────────────

  async bulkGenerateImages(params: {
    numGames: number;
    imageStyle: ImageStyle;
    includeStoryline: boolean;
    includeGenres: boolean;
    includeThemes: boolean;
  }): Promise<{ jobId: string; gamesQueued: number }> {
    // Reject if an active job exists
    const [activeJob] = await this.databaseService.db
      .select({ id: bulkImageGenJobs.id })
      .from(bulkImageGenJobs)
      .where(sql`${bulkImageGenJobs.status} IN ('pending', 'running')`)
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
    await this.databaseService.db.insert(bulkImageGenJobs).values({
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
      imageStyle: ImageStyle;
      includeStoryline: boolean;
      includeGenres: boolean;
      includeThemes: boolean;
    },
  ): Promise<void> {
    const total = pendingGames.length;
    const failures: Array<{ igdbId: number; gameName: string; error: string }> =
      [];
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    // Mark job as running
    await this.databaseService.db
      .update(bulkImageGenJobs)
      .set({ status: 'running', startedAt: new Date() })
      .where(eq(bulkImageGenJobs.jobId, jobId));

    const styleEntry = IMAGE_STYLES.find((s) => s.value === params.imageStyle);
    const styleDescriptor = styleEntry?.descriptor ?? params.imageStyle;

    const r2PublicUrlRaw =
      this.configService.get('r2PublicUrl', { infer: true }) ?? '';
    const r2PublicUrl = r2PublicUrlRaw.startsWith('http')
      ? r2PublicUrlRaw
      : `https://${r2PublicUrlRaw}`;

    for (const game of pendingGames) {
      try {
        const prompt = this.buildImagePromptFromGame(
          game,
          params,
          styleDescriptor,
        );
        const rawBuffer = await this.aiService.generateImage(prompt);
        const imageBuffer = await sharp(rawBuffer)
          .jpeg({ quality: 85 })
          .toBuffer();

        const timestamp = Date.now();
        const key = `${IMAGE_GEN_DIR}/${game.igdbId}_${timestamp}.jpg`;
        await this.s3Service.uploadImage(key, imageBuffer, 'image/jpeg');

        const publicUrl = `${r2PublicUrl}/${key}`;

        const currentImageGen = game.imageGen || {};
        const providerKey = 'cloudflare';
        const styleKey = params.imageStyle;

        const updatedImageGen = {
          ...currentImageGen,
          [providerKey]: {
            ...(currentImageGen[providerKey] || {}),
            [styleKey]: {
              url: publicUrl,
              prompt: prompt,
            },
          },
        };

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

      // Update job progress in DB
      await this.databaseService.db
        .update(bulkImageGenJobs)
        .set({ processed, succeeded, failed, failures })
        .where(eq(bulkImageGenJobs.jobId, jobId));

      // Emit progress event via EventEmitter
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

    // Mark job as completed or failed
    const finalStatus = failed === total ? 'failed' : 'completed';
    await this.databaseService.db
      .update(bulkImageGenJobs)
      .set({
        status: finalStatus,
        completedAt: new Date(),
        processed,
        succeeded,
        failed,
        failures,
      })
      .where(eq(bulkImageGenJobs.jobId, jobId));

    // Emit completed event
    this.bulkImageJobStore.emit(jobId, {
      type: 'completed',
      data: { succeeded, failed, failures },
    });

    // Refresh the materialized view
    await this.refreshAllGamesView();
  }

  async getBulkJobStatus(jobId: string) {
    const [job] = await this.databaseService.db
      .select()
      .from(bulkImageGenJobs)
      .where(eq(bulkImageGenJobs.jobId, jobId))
      .limit(1);

    if (!job) {
      throw new NotFoundException(`Bulk image job ${jobId} not found`);
    }

    return {
      jobId: job.jobId,
      status: job.status as 'pending' | 'running' | 'completed' | 'failed',
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

  buildImagePromptFromGame(
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
    },
    styleDescriptor: string,
  ): string {
    const parts: string[] = [];

    parts.push(
      `${styleDescriptor} of iconic characters from "${game.name}" set within the game's distinct world`,
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

  private mapIgdbToGame(igdbGame: IgdbGame): GameInsert {
    const formatUrl = (url?: string) => {
      if (!url) return undefined;
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
}
