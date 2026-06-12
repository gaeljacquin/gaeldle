import { orpcClient } from '@/lib/orpc';
import type { Game, GameModeSlug } from '@workspace/api-contract';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import { artStyleValuesEnum } from './other.service';
import { z } from 'zod';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));

    throw new Error(errorData.error || `Server error: ${res.status}`);
  }

  return res.json();
}

export async function getGameByIgdbId(igdbId: number): Promise<Game> {
  const res = await fetchWithTimeout(`/api/games/${igdbId}`);
  const result = await handleResponse<{ data: Game }>(res);

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

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export async function getPaginatedGames(
  page: number = 1,
  pageSize: number = 10,
  query?: string,
  sortBy: 'name' | 'firstReleaseDate' | 'igdbId' = 'name',
  sortDir: 'asc' | 'desc' = 'asc',
  igdbId?: string,
): Promise<PaginatedResponse<Game>> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    sortBy,
    sortDir,
  });

  if (query) {
    params.set('q', query);
  }

  if (igdbId) {
    params.set('igdbId', igdbId);
  }

  const res = await fetchWithTimeout(`/api/games?${params.toString()}`);

  return handleResponse<PaginatedResponse<Game>>(res);
}

export async function getRandomGame(
  excludeIds: number[] = [],
  mode?: GameModeSlug,
): Promise<Game> {
  const params = new URLSearchParams();

  if (excludeIds.length > 0) {
    params.set('excludeIds', excludeIds.join(','));
  }

  if (mode) {
    params.set('mode', mode);
  }

  const query = params.toString();
  const res = await fetchWithTimeout(
    `/api/games/random${query ? '?' + query : ''}`,
  );
  const result = await handleResponse<{ data: Game }>(res);

  return result.data;
}

export async function getRandomGames(
  count: number,
  excludeIds: number[] = [],
  mode?: GameModeSlug,
): Promise<Game[]> {
  const params = new URLSearchParams({ count: String(count) });

  if (excludeIds.length > 0) {
    params.set('excludeIds', excludeIds.join(','));
  }

  if (mode) {
    params.set('mode', mode);
  }

  const query = params.toString();
  const res = await fetchWithTimeout(`/api/games/random?${query}`);
  const result = await handleResponse<{ data: Game[] }>(res);

  return result.data;
}

export async function searchGames(
  query: string,
  limit: number = 100,
  mode?: GameModeSlug,
): Promise<Game[]> {
  if (query.length < 2) {
    return [];
  }

  const params = new URLSearchParams({ q: query, limit: String(limit) });

  if (mode) {
    params.set('mode', mode);
  }

  const res = await fetchWithTimeout(`/api/games/search?${params.toString()}`);
  const result = await handleResponse<{ data: Game[] }>(res);

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
  options: {
    includeStoryline?: boolean;
    includeGenres?: boolean;
    includeThemes?: boolean;
    artStyleValue: z.infer<typeof artStyleValuesEnum>;
  },
) {
  const result = await orpcClient.games.generateImage({ igdbId, ...options });

  return result;
}

export async function bulkGenerateImages(params: {
  numGames: number;
  artStyle: z.infer<typeof artStyleValuesEnum>; // effectively artStyleValue, not renaming this to be consistent with bulkImageGenJobs
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
  signal?: AbortSignal,
) {
  const result = await orpcClient.games.validateReplaceGame(
    {
      current,
      replacement,
    },
    { signal },
  );

  return result;
}

export async function replaceGameByIdgbId(
  pairs: Array<{ current: number; replacement: number }>,
) {
  const result = await orpcClient.games.replaceGames(pairs);

  return result;
}

export async function validateIgdbIdAdd(igdbId: number, signal?: AbortSignal) {
  const result = await orpcClient.games.validateIgdbIdAdd(
    { igdbId },
    { signal },
  );

  return result;
}

export async function addGame(igdbId: number) {
  const result = await orpcClient.games.sync({ igdb_id: igdbId });

  return result;
}
