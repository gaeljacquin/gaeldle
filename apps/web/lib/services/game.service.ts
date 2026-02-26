import { orpcClient } from '@/lib/orpc';
import type { Game, GameModeSlug, ImageStyle } from '@gaeldle/api-contract';

export async function getAllGames(mode?: GameModeSlug): Promise<Game[]> {
  if (mode === 'artwork') {
    const res = await fetch('/api/games/artwork');
    const result = await res.json();
    return result.data;
  }

  const res = await fetch('/api/games?pageSize=10000');
  const result = await res.json();
  return result.data;
}

export async function getGameByIgdbId(igdbId: number): Promise<Game> {
  const res = await fetch(`/api/games/${igdbId}`);
  const result = await res.json();
  return result.data;
}

export async function deleteGame(id: number): Promise<boolean> {
  const result = await orpcClient.games.delete({ id });
  return result.success;
}

export async function deleteBulkGames(ids: number[]): Promise<boolean> {
  const result = await orpcClient.games.deleteBulk(ids);
  return result.success;
}

export async function getPaginatedGames(
  page: number = 1,
  pageSize: number = 10,
  query?: string,
  sortBy: 'name' | 'firstReleaseDate' | 'igdbId' = 'name',
  sortDir: 'asc' | 'desc' = 'asc',
) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    sortBy,
    sortDir,
  });

  if (query) {
    params.set('q', query);
  }

  const res = await fetch(`/api/games?${params.toString()}`);
  const result = await res.json();
  return result;
}

export async function getRandomGame(excludeIds: number[] = [], mode?: GameModeSlug): Promise<Game> {
  const params = new URLSearchParams();

  if (excludeIds.length > 0) {
    params.set('excludeIds', excludeIds.join(','));
  }

  if (mode) {
    params.set('mode', mode);
  }

  const query = params.toString();
  const res = await fetch(`/api/games/random${query ? '?' + query : ''}`);
  const result = await res.json();
  return result.data;
}

export async function searchGames(query: string, limit: number = 100, mode?: GameModeSlug): Promise<Game[]> {
  if (query.length < 2) {
    return [];
  }

  const params = new URLSearchParams({ q: query, limit: String(limit) });

  if (mode) {
    params.set('mode', mode);
  }

  const res = await fetch(`/api/games/search?${params.toString()}`);
  const result = await res.json();
  return result.data;
}

export async function syncGame(igdbId: number) {
  const result = await orpcClient.games.sync({ igdb_id: igdbId });
  return result;
}

export async function testUpload(image: string, extension: string = 'jpg') {
  const result = await orpcClient.games.testUpload({
    image,
    extension,
  });
  return result;
}

export async function generateImage(
  igdbId: number,
  options: { includeStoryline: boolean; includeGenres: boolean; includeThemes: boolean; imageStyle: ImageStyle },
) {
  const result = await orpcClient.games.generateImage({ igdbId, ...options });
  return result;
}

export async function bulkGenerateImages(params: {
  numGames: number;
  imageStyle: ImageStyle;
  includeStoryline: boolean;
  includeGenres: boolean;
  includeThemes: boolean;
}) {
  const result = await orpcClient.games.bulkGenerateImages(params);
  return result;
}

export async function getBulkJobStatus(jobId: string) {
  const result = await orpcClient.games.getBulkJobStatus({ jobId });
  return result;
}

export async function validateReplaceGame(
  current: number,
  replacement: number,
) {
  const result = await orpcClient.games.validateReplaceGame({
    current,
    replacement,
  });
  return result;
}

export async function replaceGameByIdgbId(
  pairs: Array<{ current: number; replacement: number }>,
) {
  const result = await orpcClient.games.replaceGames(pairs);
  return result;
}
