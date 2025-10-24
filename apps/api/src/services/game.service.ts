import { db } from '../db';
import { games } from '../db/schema';
import { notInArray, eq } from 'drizzle-orm';

export interface Game {
  id: number;
  igdbId: number;
  name: string;
  imageUrl: string | null;
  artworks: unknown;
  info: unknown;
  firstReleaseDate: number | null;
}

/**
 * Get all video games
 */
export async function getAllGames(): Promise<Game[]> {
  const result = await db
    .select({
      id: games.id,
      igdbId: games.igdbId,
      name: games.name,
      imageUrl: games.imageUrl,
      artworks: games.artworks,
      info: games.info,
      firstReleaseDate: games.first_release_date,
    })
    .from(games)
    .orderBy(games.name);

  return result;
}

/**
 * Get a random video game excluding specified IDs
 */
export async function getRandomGame(excludeIds: number[] = []): Promise<Game | null> {
  let query = db
    .select({
      id: games.id,
      igdbId: games.igdbId,
      name: games.name,
      imageUrl: games.imageUrl,
      artworks: games.artworks,
      info: games.info,
      firstReleaseDate: games.first_release_date,
    })
    .from(games);

  // If we have excluded IDs, filter them out
  if (excludeIds.length > 0) {
    query = query.where(notInArray(games.id, excludeIds)) as typeof query;
  }

  const allGames = await query;

  if (allGames.length === 0) {
    return null;
  }

  // Select a random game
  const randomIndex = Math.floor(Math.random() * allGames.length);
  return allGames[randomIndex];
}

/**
 * Get a specific video game by ID
 */
export async function getGameById(id: number): Promise<Game | null> {
  const [game] = await db
    .select({
      id: games.id,
      igdbId: games.igdbId,
      name: games.name,
      imageUrl: games.imageUrl,
      artworks: games.artworks,
      info: games.info,
      firstReleaseDate: games.first_release_date,
    })
    .from(games)
    .where(eq(games.id, id))
    .limit(1);

  return game || null;
}
