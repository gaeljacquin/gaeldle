import { Injectable } from '@nestjs/common';
import {
  and,
  desc,
  eq,
  inArray,
  notInArray,
  sql,
  InferInsertModel,
  type SQL,
} from 'drizzle-orm';
import { DatabaseService } from '@/db/database.service';
import { allGames, games, type Game, gameObject } from '@gaeldle/api-contract';
import type { GameModeSlug } from '@/games/game-mode';
import { IgdbService, type IgdbGame } from '@/games/igdb.service';

export type GameUpdate = Partial<
  Omit<
    InferInsertModel<typeof games>,
    'id' | 'createdAt' | 'updatedAt' | 'igdbId'
  >
>;

@Injectable()
export class GamesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly igdbService: IgdbService,
  ) {}

  async getAllGames(): Promise<Game[]> {
    return await this.databaseService.db
      .select(gameObject)
      .from(games)
      .orderBy(desc(games.id));
  }

  async getGameByIgdbId(igdbId: number): Promise<Game | null> {
    const [game] = await this.databaseService.db
      .select(gameObject)
      .from(games)
      .where(eq(games.igdbId, igdbId))
      .limit(1);

    return game || null;
  }

  async getArtworkGames(): Promise<Game[]> {
    return this.databaseService.db
      .select(gameObject)
      .from(games)
      .where(
        and(sql`artworks IS NOT NULL`, sql`json_array_length(artworks) > 0`),
      )
      .orderBy(desc(games.id));
  }

  async getGamesPage(
    page: number,
    pageSize: number,
    q?: string,
  ): Promise<{ games: Game[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const where = q ? sql`name ILIKE ${'%' + q + '%'}` : undefined;

    const [gamesList, totalCount] = await Promise.all([
      this.databaseService.db
        .select(gameObject)
        .from(games)
        .where(where)
        .limit(pageSize)
        .offset(offset)
        .orderBy(desc(games.id)),
      this.databaseService.db
        .select({ count: sql<number>`count(*)` })
        .from(games)
        .where(where),
    ]);

    return {
      games: gamesList,
      total: Number(totalCount[0]?.count ?? 0),
    };
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

  async getRandomGame(
    excludeIds: number[],
    mode?: GameModeSlug,
  ): Promise<Game | null> {
    const conditions: (SQL | undefined)[] = [];

    if (excludeIds.length > 0) {
      conditions.push(notInArray(games.id, excludeIds));
    }

    if (mode === 'artwork') {
      conditions.push(
        sql`artworks IS NOT NULL`,
        sql`json_array_length(artworks) > 0`,
      );
    }

    const [game] = await this.databaseService.db
      .select(gameObject)
      .from(games)
      .where(and(...conditions))
      .orderBy(sql`RANDOM()`)
      .limit(1);

    return game || null;
  }

  async searchGames(
    query: string,
    limit: number,
    mode?: GameModeSlug,
  ): Promise<Game[]> {
    const whereClause: SQL[] = [sql`name ILIKE ${'%' + query + '%'}`];

    if (mode === 'artwork') {
      whereClause.push(
        sql`artworks IS NOT NULL`,
        sql`json_array_length(artworks) > 0`,
      );
    }

    const gamesList = await this.databaseService.db
      .select(gameObject)
      .from(games)
      .where(and(...whereClause))
      .limit(limit)
      .orderBy(desc(games.id));

    return gamesList;
  }

  async syncGameByIgdbId(
    igdbId: number,
  ): Promise<{ game: Game; operation: 'created' | 'updated' } | null> {
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
        game: updatedGame,
        operation: 'updated',
      };
    }

    const [newGame] = await this.databaseService.db
      .insert(games)
      .values(gameData)
      .returning();

    await this.refreshAllGamesView();

    return {
      game: newGame,
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

  private mapIgdbToGame(igdbGame: IgdbGame): InferInsertModel<typeof games> {
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
      info: {
        url: igdbGame.url,
        rating: igdbGame.total_rating,
        ratingCount: igdbGame.total_rating_count,
      },
    };
  }
}
