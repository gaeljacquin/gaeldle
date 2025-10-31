import type { Game } from '@/lib/types/game';

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';

export async function getAllGames(mode?: string): Promise<Game[]> {
  const endpoint = mode === 'artwork' ? `${API_BASE_URL}/api/game/artwork` : `${API_BASE_URL}/api/game`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
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

export async function getRandomGame(excludeIds: number[] = [], mode?: string): Promise<Game> {
  const response = await fetch(`${API_BASE_URL}/api/game/random`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ excludeIds, mode }),
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
