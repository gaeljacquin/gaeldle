import { db } from 'src/db';
import { games } from 'src/db/schema';
import { notInArray, eq, isNotNull } from 'drizzle-orm';
import { getAiImageUrl } from 'src/services/image.service';
import { convertSummaryToImagePrompt } from 'src/utils/ai-prompt-gen';
import { generateImageFromPrompt } from 'src/utils/ai-image-gen';

export interface Game {
  id: number;
  igdbId: number;
  name: string;
  imageUrl: string | null;
  aiImageUrl?: string | null;
  aiPrompt?: string | null;
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
 * @param imageAI - If true, generate AI image if missing
 */
export async function getRandomGame(excludeIds: number[] = [], artwork?: boolean, imageAI?: boolean): Promise<Game | null> {
  console.log('[GAME-SERVICE] getRandomGame called');
  console.log('[GAME-SERVICE] Parameters:', { excludeIds, artwork, imageAI });

  let query = db
    .select({
      id: games.id,
      igdbId: games.igdbId,
      name: games.name,
      imageUrl: games.imageUrl,
      aiImageUrl: games.aiImageUrl,
      aiPrompt: games.aiPrompt,
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
  console.log('[GAME-SERVICE] Found', allGames.length, 'games matching criteria');

  if (allGames.length === 0) {
    console.log('[GAME-SERVICE] No games found, returning null');
    return null;
  }

  // Select a random game
  const randomIndex = Math.floor(Math.random() * allGames.length);
  let selectedGame = allGames[randomIndex];
  console.log('[GAME-SERVICE] Randomly selected game at index', randomIndex, ':', selectedGame.name);

  // Handle AI image generation for image-ai mode
  if (imageAI && !selectedGame.aiImageUrl) {
    console.log('[GAME-SERVICE] AI generation mode enabled');
    console.log('[GAME-SERVICE] Selected game ID:', selectedGame.id, 'IGDB ID:', selectedGame.igdbId);
    console.log('[GAME-SERVICE] Game name:', selectedGame.name);
    console.log('[GAME-SERVICE] Current aiImageUrl:', selectedGame.aiImageUrl);
    console.log('[GAME-SERVICE] Current aiPrompt:', selectedGame.aiPrompt);

    // Check if aiPrompt exists, if not generate it
    if (!selectedGame.aiPrompt) {
      console.log('[GAME-SERVICE] No aiPrompt found, generating new prompt...');

      // Extract summary from game info
      const gameInfo = selectedGame.info as any;
      const summary = gameInfo?.summary || '';
      console.log('[GAME-SERVICE] Summary exists:', !!summary);
      if (summary) {
        console.log('[GAME-SERVICE] Summary length:', summary.length, 'chars');
      }

      if (summary) {
        try {
          // Generate AI prompt from summary
          console.log('[GAME-SERVICE] Calling convertSummaryToImagePrompt...');
          const aiPrompt = await convertSummaryToImagePrompt(selectedGame.name, summary);
          console.log('[GAME-SERVICE] AI prompt generated successfully');

          // Update the game's aiPrompt in database
          console.log('[GAME-SERVICE] Updating aiPrompt in database for IGDB ID:', selectedGame.igdbId);
          await updateGameAiPrompt(selectedGame.igdbId, aiPrompt);
          console.log('[GAME-SERVICE] Database updated with aiPrompt');

          // Update local object
          selectedGame = { ...selectedGame, aiPrompt };
        } catch (error) {
          console.error('[GAME-SERVICE] Error generating AI prompt:', error);
          throw error;
        }
      } else {
        console.warn('[GAME-SERVICE] No summary available for game ID:', selectedGame.id);
      }
    } else {
      console.log('[GAME-SERVICE] Using existing aiPrompt from database');
    }

    // If we have an aiPrompt (either from DB or just generated), generate the image
    if (selectedGame.aiPrompt) {
      console.log('[GAME-SERVICE] aiPrompt available, generating image...');
      try {
        // Generate image and get filename
        console.log('[GAME-SERVICE] Calling generateImageFromPrompt with IGDB ID:', selectedGame.igdbId);
        const aiImageFilename = await generateImageFromPrompt(selectedGame.igdbId, selectedGame.aiPrompt);
        console.log('[GAME-SERVICE] Image generated, filename:', aiImageFilename);

        // Update the game's aiImageUrl in database with just the filename
        console.log('[GAME-SERVICE] Updating aiImageUrl in database for IGDB ID:', selectedGame.igdbId);
        await updateGameAiImageUrl(selectedGame.igdbId, aiImageFilename);
        console.log('[GAME-SERVICE] Database updated with aiImageUrl');
        const aiImageUrl = await getAiImageUrl(aiImageFilename) ?? selectedGame.imageUrl;

        // Update local object
        selectedGame = { ...selectedGame, aiImageUrl };
        console.log('[GAME-SERVICE] AI image generation complete!');
      } catch (error) {
        console.error('[GAME-SERVICE] Failed to generate AI image for IGDB ID', selectedGame.igdbId, ':', error);
      }
    } else {
      console.warn('[GAME-SERVICE] No aiPrompt available, skipping image generation');
    }
  } else if (imageAI) {
    console.log('[GAME-SERVICE] AI mode enabled but aiImageUrl already exists:', selectedGame.aiImageUrl);
    const aiImageUrl = await getAiImageUrl(selectedGame.aiImageUrl) ?? selectedGame.imageUrl;
    selectedGame = { ...selectedGame, aiImageUrl };
  }

  console.log('[GAME-SERVICE] Returning selected game');
  console.log('[GAME-SERVICE] Final game state:', {
    id: selectedGame.id,
    igdbId: selectedGame.igdbId,
    name: selectedGame.name,
    hasAiImageUrl: !!selectedGame.aiImageUrl,
    hasAiPrompt: !!selectedGame.aiPrompt,
  });

  return selectedGame;
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
      aiImageUrl: games.aiImageUrl,
      aiPrompt: games.aiPrompt,
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

  if (!game) {
    return null;
  }

  const aiImageUrl = await getAiImageUrl(game.aiImageUrl) ?? game.imageUrl;

  return {
    ...game,
    aiImageUrl,
  };
}

/**
 * Update a game's AI prompt
 */
export async function updateGameAiPrompt(gameId: number, aiPrompt: string): Promise<void> {
  console.log('[GAME-SERVICE] updateGameAiPrompt - IGDB ID:', gameId);
  await db
    .update(games)
    .set({ aiPrompt })
    .where(eq(games.igdbId, gameId));
  console.log('[GAME-SERVICE] updateGameAiPrompt - Updated successfully');
}

/**
 * Update a game's AI image URL
 */
export async function updateGameAiImageUrl(gameId: number, aiImageUrl: string): Promise<void> {
  console.log('[GAME-SERVICE] updateGameAiImageUrl - IGDB ID:', gameId);
  console.log('[GAME-SERVICE] updateGameAiImageUrl - Filename:', aiImageUrl);
  await db
    .update(games)
    .set({ aiImageUrl })
    .where(eq(games.igdbId, gameId));
  console.log('[GAME-SERVICE] updateGameAiImageUrl - Updated successfully');
}
