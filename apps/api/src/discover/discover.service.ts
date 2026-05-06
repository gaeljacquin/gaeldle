import { Injectable } from '@nestjs/common';
import { inArray } from 'drizzle-orm';
import { DatabaseService } from '@/db/database.service';
import {
  games,
  domainEvents,
  DiscoverCandidate,
  DiscoverApplyResult,
} from '@workspace/api-contract';
import { IgdbService } from '@/games/igdb.service';
import { GamesService } from '@/games/games.service';

@Injectable()
export class DiscoverService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly igdbService: IgdbService,
    private readonly gamesService: GamesService,
  ) {}

  async scan(
    count: number,
    actorId: string,
  ): Promise<{
    scanEventId: number;
    candidates: DiscoverCandidate[];
    totalReturned: number;
    alreadyAddedCount: number;
  }> {
    const igdbResults = await this.igdbService.discoverCandidates(count);

    const igdbIds = igdbResults.map((g) => g.id);

    let existingSet = new Set<number>();
    if (igdbIds.length > 0) {
      const existingRows = await this.databaseService.db
        .select({ igdbId: games.igdbId })
        .from(games)
        .where(inArray(games.igdbId, igdbIds));
      existingSet = new Set(existingRows.map((r) => r.igdbId));
    }

    const candidates: DiscoverCandidate[] = igdbResults.map((g) => {
      const rawUrl = g.cover?.url;
      const imageId = g.cover?.image_id;
      let coverUrl: string | null = null;
      if (imageId) {
        coverUrl = `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`;
      } else if (rawUrl) {
        const fullUrl = rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
        coverUrl = fullUrl.replace('t_thumb', 't_cover_big');
      }

      return {
        igdbId: g.id,
        name: g.name,
        firstReleaseDate: g.first_release_date ?? null,
        coverUrl,
        totalRating: g.total_rating ?? null,
        totalRatingCount: g.total_rating_count ?? null,
        genres:
          g.genres?.map((genre) => genre.name ?? '').filter(Boolean) ?? [],
        platforms: g.platforms?.map((p) => p.name ?? '').filter(Boolean) ?? [],
        isAlreadyAdded: existingSet.has(g.id),
      };
    });

    const totalReturned = candidates.length;
    const alreadyAddedCount = candidates.filter((c) => c.isAlreadyAdded).length;

    const eventPayload = {
      count,
      candidates: candidates.map((c) => ({
        igdbId: c.igdbId,
        name: c.name,
        isAlreadyAdded: c.isAlreadyAdded,
      })),
      totalReturned,
      alreadyAddedCount,
    };

    const [insertedEvent] = await this.databaseService.db
      .insert(domainEvents)
      .values({
        eventType: 'discover_games.scanned',
        actorId,
        payload: eventPayload,
      })
      .returning({ id: domainEvents.id });

    return {
      scanEventId: insertedEvent.id,
      candidates,
      totalReturned,
      alreadyAddedCount,
    };
  }

  async apply(
    selectedIgdbIds: number[],
    scanEventId: number,
    actorId: string,
  ): Promise<{
    success: boolean;
    applyEventId: number;
    results: DiscoverApplyResult[];
  }> {
    const results: DiscoverApplyResult[] = [];

    for (const igdbId of selectedIgdbIds) {
      try {
        const syncResult = await this.gamesService.syncGameByIgdbId(igdbId);
        if (syncResult) {
          results.push({
            igdbId,
            name: syncResult.game.name,
            status: syncResult.operation,
            error: null,
          });
        } else {
          results.push({
            igdbId,
            name: null,
            status: 'error',
            error: 'Game not found on IGDB',
          });
        }
      } catch (err) {
        results.push({
          igdbId,
          name: null,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    const eventPayload = {
      scanEventId,
      selectedIgdbIds,
      results,
    };

    const [insertedEvent] = await this.databaseService.db
      .insert(domainEvents)
      .values({
        eventType: 'discover_games.applied',
        actorId,
        payload: eventPayload,
      })
      .returning({ id: domainEvents.id });

    await this.gamesService.refreshAllGamesView();

    return {
      success: true,
      applyEventId: insertedEvent.id,
      results,
    };
  }
}
