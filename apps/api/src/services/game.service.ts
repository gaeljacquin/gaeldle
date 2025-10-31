import { db } from 'src/db';
import { Game, games } from 'src/db/schema';
import { notInArray, sql, desc } from 'drizzle-orm';
import { getMaterializedView } from 'src/utils/materialized-view';

export async function getAllGames(mode?: string): Promise<Game[]> {
  const materializedView = getMaterializedView(mode ?? '');
  const query = db.select().from(materializedView);
  const result = await query;

  return result;
}

export async function getRandomGame(excludeIds: number[] = [], mode?: string): Promise<Game | null> {
  const materializedView = getMaterializedView(mode ?? '');

  let query = db.select().from(materializedView);

  if (excludeIds.length > 0) {
    query = query.where(notInArray(materializedView.igdbId, excludeIds)) as typeof query;
  }

  const result = await query;

  if (result.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * result.length);

  return result[randomIndex];
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
    console.log('Full-text search failed, falling back to ILIKE:', error);
  }

  // Fallback to ILIKE search (case-insensitive pattern matching)
  // Note: This is kept for backwards compatibility and as a safety net
  // when full-text search fails or returns no results
  // const result = await db
  //   .select()
  //   .from(materializedView)
  //   .where(ilike(materializedView.name, `%${query}%`))
  //   .orderBy(asc(materializedView.name))
  //   .limit(limit);

  // return result;

  // Return empty array if full-text search fails instead of falling back
  return [];
}

// export async function updateGameAiPrompt(gameId: number, aiPrompt: string): Promise<void> {
//   console.log('[GAME-SERVICE] updateGameAiPrompt - IGDB ID:', gameId);
//   await db
//     .update(games)
//     .set({ aiPrompt })
//     .where(eq(games.igdbId, gameId));
//   console.log('[GAME-SERVICE] updateGameAiPrompt - Updated successfully');
// }

// export async function updateGameAiImageUrl(gameId: number, aiImageUrl: string): Promise<void> {
//   console.log('[GAME-SERVICE] updateGameAiImageUrl - IGDB ID:', gameId);
//   console.log('[GAME-SERVICE] updateGameAiImageUrl - Filename:', aiImageUrl);
//   await db
//     .update(games)
//     .set({ aiImageUrl })
//     .where(eq(games.igdbId, gameId));
//   console.log('[GAME-SERVICE] updateGameAiImageUrl - Updated successfully');
// }
