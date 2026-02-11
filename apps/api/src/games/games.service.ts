import { Injectable } from '@nestjs/common';
import {
  desc,
  eq,
  inArray,
  notInArray,
  sql,
  InferInsertModel,
  type SQL,
} from 'drizzle-orm';
import { DatabaseService } from '@/db/database.service';
import { allGames, games, type Game } from '@gaeldle/api-contract';
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
    return await this.databaseService.db.select().from(allGames);
  }

  async getArtworkGames(): Promise<Game[]> {
    return this.databaseService.db
      .select()
      .from(games)
      .where(
        and(sql`artworks IS NOT NULL`, sql`jsonb_array_length(artworks) > 0`),
      )
      .orderBy(desc(games.id));
  }

  async getGamesPage(
    page: number,
    pageSize: number,
    q?: string,
  ): Promise<{ games: Game[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const where = q ? sql`name ILIKE %${q}%` : undefined;

    const [gamesList, totalCount] = await Promise.all([
      this.databaseService.db
        .select()
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
        sql`jsonb_array_length(artworks) > 0`,
      );
    }

    const [game] = await this.databaseService.db
      .select()
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
    const whereClause: SQL[] = [sql`name ILIKE %${query}%`];

    if (mode === 'artwork') {
      whereClause.push(
        sql`artworks IS NOT NULL`,
        sql`jsonb_array_length(artworks) > 0`,
      );
    }

    const gamesList = await this.databaseService.db
      .select()
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

      return {
        game: updatedGame,
        operation: 'updated',
      };
    }

    const [newGame] = await this.databaseService.db
      .insert(games)
      .values(gameData)
      .returning();

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

    return updatedGame || null;
  }

  async deleteGame(id: number): Promise<number | null> {
    const [deletedGame] = await this.databaseService.db
      .delete(games)
      .where(eq(games.id, id))
      .returning({ id: games.id });

    return deletedGame?.id ?? null;
  }

  async deleteGames(ids: number[]): Promise<number[]> {
    const deletedRows = await this.databaseService.db
      .delete(games)
      .where(inArray(games.id, ids))
      .returning({ id: games.id });

    return deletedRows.map((row) => row.id);
  }

  private mapIgdbToGame(igdbGame: IgdbGame): InferInsertModel<typeof games> {
    return {
      igdbId: igdbGame.id,
      name: igdbGame.name,
      summary: igdbGame.summary,
      storyline: igdbGame.storyline,
      firstReleaseDate: igdbGame.first_release_date,
      imageUrl: igdbGame.cover?.url?.replace('t_thumb', 't_720p'),
      artworks: igdbGame.artworks?.map((art) => ({
        ...art,
        url: art.url?.replace('t_thumb', 't_720p'),
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

function and(...args: (SQL | undefined)[]): SQL | undefined {
  const filtered = args.filter((arg): arg is SQL => arg !== undefined);
  if (filtered.length === 0) return undefined;
  if (filtered.length === 1) return filtered[0];
  return sql.join(filtered, sql` AND `);
}
