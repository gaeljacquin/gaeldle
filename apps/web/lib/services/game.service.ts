import type { Game } from '@/lib/types/game';

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';

/**
 * Fetch all video games from the API
 * @param artwork - If true, only fetch games with artwork
 */
export async function getAllGames(artwork?: boolean): Promise<Game[]> {
  const response = await fetch(`${API_BASE_URL}/api/game`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ artwork }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch video games');
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch video games');
  }

  return data.data as Game[];
}

/**
 * Fetch a random video game from the API
 * @param excludeIds - Array of game IDs to exclude
 * @param artwork - If true, only fetch games with artwork
 */
export async function getRandomGame(excludeIds: number[] = [], artwork?: boolean): Promise<Game> {
  const response = await fetch(`${API_BASE_URL}/api/game/random`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ excludeIds, artwork }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch random video game');
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch random video game');
  }

  return data.data as Game;
}

/**
 * Fetch a specific video game by ID
 */
export async function getGameById(id: number): Promise<Game> {
  const response = await fetch(`${API_BASE_URL}/api/game/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch video game');
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch video game');
  }

  return data.data as Game;
}
