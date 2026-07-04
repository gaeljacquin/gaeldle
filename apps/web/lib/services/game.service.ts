import { orpcClient } from '@/lib/orpc';
import type { Game, ArtStyleValue } from '@workspace/api-contract';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  return response.json();
}

export async function getGameByIgdbId(igdbId: number): Promise<Game> {
  const url = '/api/private/games/' + igdbId;
  const response = await fetchWithTimeout(url);
  const result = await handleResponse<{ data: Game }>(response);

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

  const url = '/api/games?' + params.toString();
  const response = await fetchWithTimeout(url);

  return handleResponse<PaginatedResponse<Game>>(response);
}

export async function getRandomGame(
  excludeIds: number[] = [],
  mode?: string,
): Promise<Game> {
  const params = new URLSearchParams();

  if (excludeIds.length > 0) {
    params.set('excludeIds', excludeIds.join(','));
  }

  if (mode) {
    params.set('mode', mode);
  }

  const query = params.toString();
  const url = '/api/games/random' + (query ? '?' + query : '');
  const response = await fetchWithTimeout(url);
  const result = await handleResponse<{ data: Game }>(response);

  return result.data;
}

export async function getRandomGames(
  count: number,
  excludeIds: number[] = [],
  mode?: string,
): Promise<Game[]> {
  const params = new URLSearchParams({ count: String(count) });

  if (excludeIds.length > 0) {
    params.set('excludeIds', excludeIds.join(','));
  }

  if (mode) {
    params.set('mode', mode);
  }

  const query = params.toString();
  const url = '/api/games/random?' + query;
  const response = await fetchWithTimeout(url);
  const result = await handleResponse<{ data: Game[] }>(response);

  return result.data;
}

export async function searchGames(
  query: string,
  limit: number = 100,
  mode?: string,
): Promise<Game[]> {
  if (query.length < 2) {
    return [];
  }

  const params = new URLSearchParams({ q: query, limit: String(limit) });

  if (mode) {
    params.set('mode', mode);
  }

  const url = '/api/games/search?' + params.toString();
  const response = await fetchWithTimeout(url);
  const result = await handleResponse<{ data: Game[] }>(response);

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
    artStyleValue: ArtStyleValue;
  },
) {
  const { artStyleValue, ...rest } = options;
  const result = await orpcClient.imageGen.generateImage({
    igdbId,
    artStyle: artStyleValue,
    ...rest,
  });

  return result;
}

export async function generateImages(params: {
  numGames: number;
  artStyle: ArtStyleValue;
  includeStoryline: boolean;
  includeGenres: boolean;
  includeThemes: boolean;
}) {
  const result = await orpcClient.imageGen.generateImages(params);

  return result;
}

export async function getImageGenStatus(imageGenId: string) {
  const result = await orpcClient.imageGen.getImageGenStatus({ imageGenId });

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

export const gameByIgdbIdQueryOptions = (igdbId: number) => ({
  queryKey: ['game', igdbId],
  queryFn: () => getGameByIgdbId(igdbId),
});

export const paginatedGamesQueryOptions = (
  page: number = 1,
  pageSize: number = 10,
  query?: string,
  sortBy: 'name' | 'firstReleaseDate' | 'igdbId' = 'name',
  sortDir: 'asc' | 'desc' = 'asc',
  igdbId?: string,
) => ({
  queryKey: ['games', { page, pageSize, query, sortBy, sortDir, igdbId }],
  queryFn: () =>
    getPaginatedGames(page, pageSize, query, sortBy, sortDir, igdbId),
});

export const randomGameQueryOptions = (
  excludeIds: number[] = [],
  mode?: string,
) => ({
  queryKey: ['randomGame', { excludeIds, mode }],
  queryFn: () => getRandomGame(excludeIds, mode),
});

export const randomGamesQueryOptions = (
  count: number,
  excludeIds: number[] = [],
  mode?: string,
) => ({
  queryKey: ['randomGames', { count, excludeIds, mode }],
  queryFn: () => getRandomGames(count, excludeIds, mode),
});

export const searchGamesQueryOptions = (
  query: string,
  limit: number = 100,
  mode?: string,
) => ({
  queryKey: ['searchGames', { query, limit, mode }],
  queryFn: () => searchGames(query, limit, mode),
});
