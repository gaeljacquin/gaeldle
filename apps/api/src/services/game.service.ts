import { db } from 'src/db';
import { allGames, Game, games } from 'src/db/schema';
import {
  notInArray,
  sql,
  desc,
  eq,
  // isNotNull,
} from 'drizzle-orm';
import { convertSummaryToImagePrompt } from 'src/utils/ai-prompt-gen';
import { generateImageFromPrompt } from 'src/utils/ai-image-gen';
import { getAiImageUrl } from 'src/services/image.service';
import type { GameModeSlug } from '@gaeldle/types/game';

export async function getAllGames(mode?: string): Promise<Game[]> {
  const query = db.select().from(allGames);
  const result = await query;

  return result;
}

export async function getGamesPage(page: number, pageSize: number): Promise<{ games: Game[]; total: number }> {
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10;
  const cappedPageSize = Math.min(safePageSize, 100);
  const offset = (safePage - 1) * cappedPageSize;

  const [gamesResult, countResult] = await Promise.all([
    db.select().from(allGames).limit(cappedPageSize).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(allGames),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return {
    games: gamesResult,
    total,
  };
}

/**
 * To test a specific game, use:
 * const igdbIdTest = 1076;
 * query = query.where(eq(allGames.igdbId, igdbIdTest)) as typeof query;
 */
export async function getRandomGame(excludeIds: number[] = [], mode?: GameModeSlug): Promise<Game | null> {
  let query = db.select().from(allGames);

  if (excludeIds.length > 0) {
    query = query.where(notInArray(allGames.igdbId, excludeIds)) as typeof query;
  }

  const result = await query;

  if (result.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * result.length);
  const randomGame = result[randomIndex];
  let aiImageFilename = randomGame.aiImageUrl;
  let aiPrompt = randomGame.aiPrompt;

  if (mode === 'image-ai') {
    const summary = randomGame.summary || randomGame.storyline || randomGame.name;

    if (!aiPrompt) {
      aiPrompt = await convertSummaryToImagePrompt(randomGame.name, summary);
      await updateGameAiPrompt(randomGame.igdbId, aiPrompt);
    }

    if (!aiImageFilename) {
      aiImageFilename = await generateImageFromPrompt(randomGame.igdbId, aiPrompt);
      await updateGameAiImageUrl(randomGame.igdbId, aiImageFilename);
    }

    await db.refreshMaterializedView(allGames);
  }

  const aiImageUrl = await getAiImageUrl(aiImageFilename) ?? randomGame.imageUrl;

  return {
    ...randomGame,
    aiPrompt,
    aiImageUrl,
  };
}

export async function searchGames(query: string, limit: number = 100, mode?: string): Promise<Game[]> {
  try {
    // Try full-text search first using tsvector
    // Convert query to tsquery format (handle spaces and special chars)
    const tsQuery = query.trim().split(/\s+/).join(' & ');

    // Build the full-text search query with mode-specific filters
    // Valid modes: 'cover-art', 'image-ai', 'artwork', 'timeline', 'timeline-2', 'specifications'
    let whereCondition = sql`name_search @@ to_tsquery('english', ${tsQuery})`;

    // Useless as games with no artworks or first release dates have been removed from the DB
    if (mode === 'artwork') {
      whereCondition = sql`${whereCondition} AND artworks IS NOT NULL`;
    } else if (mode === 'timeline' || mode === 'timeline-2') {
      whereCondition = sql`${whereCondition} AND first_release_date IS NOT NULL`;
    }

    // Use ts_rank_cd with normalization for better relevance sorting
    // Also boost exact phrase matches and shorter names (more specific results)
    // Normalization divides rank by document length, favoring shorter, more relevant matches
    const result = await db
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
        `)
      )
      .limit(limit);

    // If full-text search returns results, use them
    if (result.length > 0) {
      return result as Game[];
    }
  } catch (error) {
    console.log('Something went wrong:', error);
  }

  return [];
}

export async function updateGameAiPrompt(gameId: number, aiPrompt: string): Promise<void> {
  console.log('[GAME-SERVICE] updateGameAiPrompt - IGDB ID:', gameId);
  await db
    .update(games)
    .set({ aiPrompt })
    .where(eq(games.igdbId, gameId));
  console.log('[GAME-SERVICE] updateGameAiPrompt - Updated successfully');
}

export async function updateGameAiImageUrl(gameId: number, aiImageUrl: string): Promise<void> {
  console.log('[GAME-SERVICE] updateGameAiImageUrl - IGDB ID:', gameId);
  console.log('[GAME-SERVICE] updateGameAiImageUrl - Filename:', aiImageUrl);
  await db
    .update(games)
    .set({ aiImageUrl })
    .where(eq(games.igdbId, gameId));
  console.log('[GAME-SERVICE] updateGameAiImageUrl - Updated successfully');
}
