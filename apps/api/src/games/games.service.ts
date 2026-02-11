import { Injectable } from '@nestjs/common';
import {
  desc,
  eq,
  inArray,
  notInArray,
  sql,
  InferInsertModel,
  InferSelectModel,
  type SQL,
} from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { DatabaseService } from 'src/db/database.service';
import { allGames, games, type Game } from 'src/db/schema';
import type { GameModeSlug } from 'src/games/game-mode';
import { IgdbService, type IgdbGame } from 'src/games/igdb.service';

export type GameUpdate = Partial<
  Omit<
    InferInsertModel<typeof games>,
    'id' | 'igdbId' | 'createdAt' | 'updatedAt'
  >
>;

export type SyncGameResult = {
  operation: 'inserted' | 'updated';
  game: InferSelectModel<typeof games>;
};

@Injectable()
export class GamesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly igdbService: IgdbService,
  ) {}

  async getAllGames(): Promise<Game[]> {
    const result = await this.databaseService.db.select().from(allGames);
    return result;
  }

  async getGamesPage(
    page: number,
    pageSize: number,
    search?: string,
  ): Promise<{ games: Game[]; total: number }> {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safePageSize =
      Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10;
    const cappedPageSize = Math.min(safePageSize, 100);
    const offset = (safePage - 1) * cappedPageSize;

    let whereCondition: SQL | undefined = undefined;
    let orderBy: SQL | PgColumn;

    if (search && search.trim().length >= 2) {
      const tsQuery = search.trim().split(/\s+/).join(' & ');
      whereCondition = sql`name_search @@ to_tsquery('english', ${tsQuery})`;
      orderBy = desc(
        sql`ts_rank_cd(name_search, to_tsquery('english', ${tsQuery}), 32)`,
      );
    } else {
      orderBy = games.name;
    }

    const query = this.databaseService.db.select().from(games).$dynamic();
    const countQuery = this.databaseService.db
      .select({ count: sql<number>`count(*)` })
      .from(games)
      .$dynamic();

    if (whereCondition) {
      query.where(whereCondition);
      countQuery.where(whereCondition);
    }

    const [gamesResult, countResult] = await Promise.all([
      query.orderBy(orderBy).limit(cappedPageSize).offset(offset),
      countQuery,
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return {
      games: gamesResult as Game[],
      total,
    };
  }

  async getRandomGame(excludeIds: number[] = []): Promise<Game | null> {
    let query = this.databaseService.db.select().from(allGames);

    if (excludeIds.length > 0) {
      query = query.where(
        notInArray(allGames.igdbId, excludeIds),
      ) as typeof query;
    }

    const result = await query;

    if (result.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * result.length);
    const randomGame = result[randomIndex];

    return randomGame;
  }

  async searchGames(
    query: string,
    limit: number = 100,
    mode?: GameModeSlug,
  ): Promise<Game[]> {
    try {
      const tsQuery = query.trim().split(/\s+/).join(' & ');

      let whereCondition = sql`name_search @@ to_tsquery('english', ${tsQuery})`;

      if (mode === 'artwork') {
        whereCondition = sql`${whereCondition} AND artworks IS NOT NULL`;
      } else if (mode === 'timeline' || mode === 'timeline-2') {
        whereCondition = sql`${whereCondition} AND first_release_date IS NOT NULL`;
      }

      const result = await this.databaseService.db
        .select()
        .from(games)
        .where(whereCondition)
        .orderBy(
          desc(sql`
            ts_rank_cd(name_search, to_tsquery('english', ${tsQuery}), 32) *
            (CASE WHEN LOWER(name) = LOWER(${query}) THEN 10.0
                  WHEN LOWER(name) LIKE LOWER(${query} || '%') THEN 5.0
                  WHEN LOWER(name) LIKE LOWER('%' || ${query}) THEN 3.0
                  ELSE 1.0
             END) /
            (1.0 + LENGTH(name) / 100.0)
          `),
        )
        .limit(limit);

      if (result.length > 0) {
        return result as Game[];
      }
    } catch (error) {
      console.log('Something went wrong:', error);
    }

    return [];
  }

  async updateGame(id: number, updates: GameUpdate): Promise<Game | null> {
    const result = await this.databaseService.db
      .update(games)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(games.id, id))
      .returning();

    const updatedGame = result[0] ?? null;

    if (updatedGame) {
      await this.refreshAllGamesBestEffort();
    }

    return updatedGame;
  }

  async deleteGame(id: number): Promise<number | null> {
    const result = await this.databaseService.db
      .delete(games)
      .where(eq(games.id, id))
      .returning({ id: games.id });

    const deletedId = result[0]?.id ?? null;

    if (deletedId) {
      await this.refreshAllGamesBestEffort();
    }

    return deletedId;
  }

  async deleteGames(ids: number[]): Promise<number[]> {
    if (ids.length === 0) return [];

    const result = await this.databaseService.db
      .delete(games)
      .where(inArray(games.id, ids))
      .returning({ id: games.id });

    const deletedIds = result.map((item) => item.id);

    if (deletedIds.length > 0) {
      await this.refreshAllGamesBestEffort();
    }

    return deletedIds;
  }

  async syncGameByIgdbId(igdbId: number): Promise<SyncGameResult | null> {
    const igdbGame = await this.igdbService.getGameById(igdbId);
    if (!igdbGame) {
      return null;
    }

    const gameData = this.mapIgdbGameToRecord(igdbGame);
    const updatedResult = await this.databaseService.db
      .update(games)
      .set({
        ...gameData,
        updatedAt: new Date(),
      })
      .where(eq(games.igdbId, igdbId))
      .returning();

    const updatedGame = updatedResult[0];
    if (updatedGame) {
      await this.refreshAllGamesBestEffort();
      return {
        operation: 'updated',
        game: updatedGame,
      };
    }

    const insertResult = await this.databaseService.db
      .insert(games)
      .values({
        igdbId,
        ...gameData,
      })
      .returning();

    const insertedGame = insertResult[0] ?? null;
    if (!insertedGame) {
      return null;
    }

    await this.refreshAllGamesBestEffort();
    return {
      operation: 'inserted',
      game: insertedGame,
    };
  }

  private async refreshAllGamesBestEffort() {
    try {
      await this.databaseService.db.execute(
        sql`REFRESH MATERIALIZED VIEW all_games`,
      );
    } catch (error) {
      console.warn('Failed to refresh all_games materialized view:', error);
    }
  }

  private mapIgdbGameToRecord(
    igdbGame: IgdbGame,
  ): Omit<InferInsertModel<typeof games>, 'id' | 'igdbId' | 'createdAt'> {
    const imageId = igdbGame.cover?.image_id;
    const imageUrl = imageId ? this.imageUrlFor(imageId, 'cover_big') : null;
    const artworks =
      igdbGame.artworks
        ?.map((artwork) => artwork.image_id)
        .filter((artworkImageId): artworkImageId is string =>
          Boolean(artworkImageId),
        )
        .map((artworkImageId) => ({
          image_id: artworkImageId,
          url: this.imageUrlFor(artworkImageId, 'screenshot_big'),
        })) ?? [];

    return {
      name: igdbGame.name,
      info: igdbGame,
      imageUrl,
      artworks,
      keywords: this.toNameList(igdbGame.keywords),
      franchises: this.toNameList(igdbGame.franchises),
      gameEngines: this.toNameList(igdbGame.game_engines),
      gameModes: this.toNameList(igdbGame.game_modes),
      genres: this.toNameList(igdbGame.genres),
      involvedCompanies:
        igdbGame.involved_companies?.map((company) => ({
          name: company.company?.name ?? null,
          publisher: Boolean(company.publisher),
          developer: Boolean(company.developer),
        })) ?? [],
      platforms: this.toNameList(igdbGame.platforms),
      playerPerspectives: this.toNameList(igdbGame.player_perspectives),
      releaseDates:
        igdbGame.release_dates?.map((releaseDate) => ({
          human: releaseDate.human ?? null,
          date: releaseDate.date ?? null,
          platform: releaseDate.platform?.name ?? null,
        })) ?? [],
      themes: this.toNameList(igdbGame.themes),
      firstReleaseDate: igdbGame.first_release_date ?? null,
      summary: igdbGame.summary ?? null,
      storyline: igdbGame.storyline ?? null,
      updatedAt: new Date(),
    };
  }

  private toNameList(items?: Array<{ name?: string }>): string[] {
    if (!items || items.length === 0) {
      return [];
    }

    return items
      .map((item) => item.name?.trim())
      .filter((name): name is string => Boolean(name));
  }

  private imageUrlFor(
    imageId: string,
    size: 'cover_big' | 'screenshot_big',
  ): string {
    return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
  }
}
