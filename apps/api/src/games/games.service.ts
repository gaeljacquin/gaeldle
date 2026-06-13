import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, inArray, sql } from 'drizzle-orm';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { DatabaseService } from '@/db/database.service';
import {
  games,
  type Game,
  gameObject,
  type SyncOperation,
  ReplaceGameResult,
  artStyles as artStylesView,
  type ArtStyleValue,
  GameInsert,
} from '@workspace/api-contract';
import { IgdbService, type IgdbGame } from '@/lib/igdb.service';
import { AiService } from '@/lib/ai.service';
import { S3Service } from '@/lib/s3.service';
import type { AppConfiguration } from '@/config/configuration';
import { IMAGE_GEN_DIR, IMAGE_PROMPT_SUFFIX } from '@workspace/shared';

interface GenerateImageInput {
  igdbId: number;
  includeStoryline?: boolean;
  includeGenres?: boolean;
  includeThemes?: boolean;
  artStyle?: ArtStyleValue; // effectively artStyleValue, not renaming this to be consistent with bulkImageGenJobs
}

@Injectable()
export class GamesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly igdbService: IgdbService,
    private readonly aiService: AiService,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService<AppConfiguration>,
  ) {}

  async getGameByIgdbId(igdbId: number): Promise<Game | null> {
    const [game] = await this.databaseService.db
      .select(gameObject)
      .from(games)
      .where(eq(games.igdbId, igdbId))
      .limit(1);

    return game || null;
  }

  private refreshTimeout: NodeJS.Timeout | null = null;
  private pendingRefresh: Promise<void> | null = null;

  async refreshAllGamesView(immediate = false) {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }

    if (immediate) {
      await this.performRefresh();

      return;
    }

    return new Promise<void>((resolve) => {
      this.refreshTimeout = setTimeout(() => {
        void this.performRefresh().then(() => resolve());
      }, 1000);
    });
  }

  private async performRefresh() {
    if (this.pendingRefresh) {
      return this.pendingRefresh;
    }

    this.pendingRefresh = (async () => {
      try {
        await this.databaseService.db.execute(
          sql`REFRESH MATERIALIZED VIEW all_games`,
        );
      } catch (e) {
        console.error('Failed to refresh materialized view', e);
      } finally {
        this.pendingRefresh = null;
      }
    })();

    return this.pendingRefresh;
  }

  async syncGameByIgdbId(
    igdbId: number,
    shouldRefresh = true,
  ): Promise<{
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

      if (shouldRefresh) {
        void this.refreshAllGamesView();
      }

      return {
        game: updatedGame as unknown as Game,
        operation: 'updated',
      };
    }

    const [newGame] = await this.databaseService.db
      .insert(games)
      .values(gameData)
      .returning();

    if (shouldRefresh) {
      void this.refreshAllGamesView();
    }

    return {
      game: newGame as unknown as Game,
      operation: 'created',
    };
  }

  async updateGame(
    id: number,
    updates: Partial<GameInsert>,
    shouldRefresh = true,
  ): Promise<Game | null> {
    const [updatedGame] = await this.databaseService.db
      .update(games)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(games.id, id))
      .returning();

    if (updatedGame && shouldRefresh) {
      void this.refreshAllGamesView();
    }

    return updatedGame || null;
  }

  async deleteGame(id: number, shouldRefresh = true): Promise<number | null> {
    const [deletedGame] = await this.databaseService.db
      .delete(games)
      .where(eq(games.id, id))
      .returning({ id: games.id });

    if (deletedGame && shouldRefresh) {
      void this.refreshAllGamesView();
    }

    return deletedGame?.id ?? null;
  }

  async deleteGames(ids: number[], shouldRefresh = true): Promise<number[]> {
    const deletedRows = await this.databaseService.db
      .delete(games)
      .where(inArray(games.id, ids))
      .returning({ id: games.id });

    if (deletedRows.length > 0 && shouldRefresh) {
      void this.refreshAllGamesView();
    }

    return deletedRows.map((row) => row.id);
  }

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

  private makeResult(
    pair: { current: number; replacement: number },
    status: 'skipped' | 'error',
    message: string,
  ): ReplaceGameResult {
    return { ...pair, status, message, gameName: null };
  }

  private partitionPairs(
    pairs: Array<{ current: number; replacement: number }>,
    existingReplacementSet: Set<number>,
  ): { validPairs: typeof pairs; skippedResults: ReplaceGameResult[] } {
    const validPairs: typeof pairs = [];
    const skippedResults: ReplaceGameResult[] = [];

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

  private async fetchIgdbGameMap(
    validPairs: Array<{ current: number; replacement: number }>,
  ): Promise<{ igdbGameMap: Map<number, GameInsert> } | ReplaceGameResult[]> {
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
    results: ReplaceGameResult[],
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
  ): Promise<{ success: boolean; results: Array<ReplaceGameResult> }> {
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
    const results: Array<ReplaceGameResult> = [...skippedResults];

    if (validPairs.length === 0)
      return {
        success: true,
        results,
      };

    const igdbResult = await this.fetchIgdbGameMap(validPairs);

    if (Array.isArray(igdbResult)) {
      return { success: false, results: [...results, ...igdbResult] };
    }

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

    if (anyUpdated) {
      await this.refreshAllGamesView();
    }

    return { success: true, results };
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
    const game = await this.getGameByIgdbId(igdbId);
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

    const updatedGame = await this.updateGame(game.id, {
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
