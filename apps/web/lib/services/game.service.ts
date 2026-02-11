import { orpcClient } from '@/lib/orpc';
import type { Game } from '@gaeldle/api-contract';

export async function getAllGames(mode?: string): Promise<Game[]> {
  if (mode === 'artwork') {
    const result = await orpcClient.games.getArtwork();
    return result.data;
  }

  const result = await orpcClient.games.list();
  return result.data;
}

export async function getPaginatedGames(
  page: number = 1,
  pageSize: number = 10,
  query?: string
) {
  const result = await orpcClient.games.list({
    page,
    pageSize,
    q: query,
  });
  return result;
}

export async function getRandomGame(excludeIds: number[] = [], mode?: string): Promise<Game> {
  const result = await orpcClient.games.getRandom({
    excludeIds,
    mode: mode as any,
  });
  return result.data;
}

export async function searchGames(query: string, limit: number = 100, mode?: string): Promise<Game[]> {
  if (query.length < 2) {
    return [];
  }

  const result = await orpcClient.games.search({
    q: query,
    limit,
    mode: mode as any,
  });

  return result.data;
}
