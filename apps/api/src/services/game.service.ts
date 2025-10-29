import { db } from '../db';
import { games } from '../db/schema';
import { notInArray, eq, isNotNull } from 'drizzle-orm';

export interface Game {
  id: number;
  igdbId: number;
  name: string;
  imageUrl: string | null;
  artworks: unknown;
  info: unknown;
  firstReleaseDate: number | null;
  keywords?: unknown;
  franchises?: unknown;
  game_engines?: unknown;
  game_modes?: unknown;
  genres?: unknown;
  involved_companies?: unknown;
  platforms?: unknown;
  player_perspectives?: unknown;
  release_dates?: unknown;
  themes?: unknown;
}

/**
 * Get all video games
 * @param artwork - If true, only return games with artwork
 */
export async function getAllGames(artwork?: boolean): Promise<Game[]> {
  let query = db
    .select({
      id: games.id,
      igdbId: games.igdbId,
      name: games.name,
      imageUrl: games.imageUrl,
      artworks: games.artworks,
      info: games.info,
      firstReleaseDate: games.first_release_date,
      keywords: games.keywords,
      franchises: games.franchises,
      game_engines: games.game_engines,
      game_modes: games.game_modes,
      genres: games.genres,
      involved_companies: games.involved_companies,
      platforms: games.platforms,
      player_perspectives: games.player_perspectives,
      release_dates: games.release_dates,
      themes: games.themes,
    })
    .from(games);

  // If artwork filter is requested, add where clause
  if (artwork) {
    query = query.where(isNotNull(games.artworks)) as typeof query;
  }

  const result = await query.orderBy(games.name);

  return result;
}

/**
 * Get a random video game excluding specified IDs
 * @param excludeIds - Array of game IDs to exclude
 * @param artwork - If true, only return games with artwork
 */
export async function getRandomGame(excludeIds: number[] = [], artwork?: boolean): Promise<Game | null> {
  let query = db
    .select({
      id: games.id,
      igdbId: games.igdbId,
      name: games.name,
      imageUrl: games.imageUrl,
      artworks: games.artworks,
      info: games.info,
      firstReleaseDate: games.first_release_date,
      keywords: games.keywords,
      franchises: games.franchises,
      game_engines: games.game_engines,
      game_modes: games.game_modes,
      genres: games.genres,
      involved_companies: games.involved_companies,
      platforms: games.platforms,
      player_perspectives: games.player_perspectives,
      release_dates: games.release_dates,
      themes: games.themes,
    })
    .from(games);

  // Build where conditions
  const conditions = [];

  if (excludeIds.length > 0) {
    conditions.push(notInArray(games.id, excludeIds));
  }

  if (artwork) {
    conditions.push(isNotNull(games.artworks));
  }

  // Apply conditions if any exist
  if (conditions.length > 0) {
    conditions.forEach((condition) => {
      query = query.where(condition) as typeof query;
    })
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
      keywords: games.keywords,
      franchises: games.franchises,
      game_engines: games.game_engines,
      game_modes: games.game_modes,
      genres: games.genres,
      involved_companies: games.involved_companies,
      platforms: games.platforms,
      player_perspectives: games.player_perspectives,
      release_dates: games.release_dates,
      themes: games.themes,
    })
    .from(games)
    .where(eq(games.id, id))
    .limit(1);

  return game || null;
}
