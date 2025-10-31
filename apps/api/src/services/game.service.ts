import { db } from 'src/db';
import { allGames, allGamesWithArtwork, Game } from 'src/db/schema';
import { notInArray, ilike } from 'drizzle-orm';
import { getMaterializedView } from 'src/utils/materialized-vew';

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
  const materializedView = getMaterializedView(mode ?? '');

  // Perform case-insensitive search using ILIKE
  const result = await db
    .select()
    .from(materializedView)
    .where(ilike(materializedView.name, `%${query}%`))
    .limit(limit);

  return result;
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
