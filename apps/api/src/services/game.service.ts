import { db } from 'src/db';
import { allGames, allGamesWithArtwork, Game } from 'src/db/schema';
import { notInArray } from 'drizzle-orm';

/**
 * Get all video games
 * @param artwork - If true, only return games with artwork
 */
export async function getAllGames(artwork?: boolean): Promise<Game[]> {
  let materializedView;

  if (artwork) {
    materializedView = allGamesWithArtwork;
  } else {
    materializedView = allGames;
  }

  const query = db.select().from(materializedView);
  const result = await query;

  return result;
}

/**
 * Get a random video game excluding specified IGDB IDs
 * @param excludeIds - Array of IGDB IDs to exclude
 * @param artwork - If true, only return games with artwork
 */
export async function getRandomGame(excludeIds: number[] = [], artwork?: boolean): Promise<Game | null> {
  const materializedView = artwork ? allGamesWithArtwork : allGames;

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
