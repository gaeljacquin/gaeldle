import { apiClient } from '@/lib/api-client';
import type { Game, ArtStyleValue } from '@workspace/api/db';
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
  const { data, error } = await apiClient.DELETE('/api/games/{id}', {
    params: { path: { id } },
  });

  if (error || !data) {
    throw new Error('Failed to delete game');
  }

  return data.success;
}

export async function deleteBulkGames(ids: number[]): Promise<boolean> {
  const { data, error } = await apiClient.DELETE('/api/games/bulk', {
    body: { ids },
  });

  if (error || !data) {
    throw new Error('Failed to bulk delete games');
  }

  return data.success;
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
  sortBy: 'name' | 'firstReleaseDate' | 'igdbId' | 'createdAt' = 'name',
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
  const { data, error } = await apiClient.POST('/api/games/sync', {
    body: { igdb_id: igdbId },
  });

  if (error || !data) {
    throw new Error('Failed to sync game');
  }

  return data;
}

export async function testUpload(image: string, extension: string = 'jpg') {
  const { data, error } = await apiClient.POST('/api/sample/upload-image', {
    body: { image, extension },
  });

  if (error || !data) {
    throw new Error('Failed to test upload');
  }

  return data;
}

export async function generateImage(
  igdbId: number,
  options: {
    includeStoryline?: boolean;
    includeGenres?: boolean;
    includeThemes?: boolean;
    artStyleValue: ArtStyleValue;
    provider: string;
  },
) {
  const {
    artStyleValue,
    includeStoryline = false,
    includeGenres = false,
    includeThemes = false,
    provider,
  } = options;
  const { data, error } = await apiClient.POST(
    '/api/image-gen/generate-image',
    {
      body: {
        igdbId,
        artStyle: artStyleValue,
        includeStoryline,
        includeGenres,
        includeThemes,
        provider,
      },
    },
  );

  if (error || !data) {
    throw new Error('Failed to generate image');
  }

  return data;
}

export async function deleteGeneratedImage(
  igdbId: number,
  artStyleValue: ArtStyleValue,
) {
  const { data, error } = await apiClient.POST('/api/image-gen/delete-image', {
    body: {
      igdbId,
      artStyle: artStyleValue,
    },
  });

  if (error || !data) {
    throw new Error('Failed to delete generated image');
  }

  return data;
}

export async function generateImages(params: {
  numGames: number;
  artStyle: ArtStyleValue;
  includeStoryline: boolean;
  includeGenres: boolean;
  includeThemes: boolean;
  provider: string;
}) {
  const { data, error } = await apiClient.POST(
    '/api/image-gen/generate-images',
    {
      body: params,
    },
  );

  if (error || !data) {
    throw new Error('Failed to generate images');
  }

  return data;
}

export async function getImageGenStatus(imageGenId: string) {
  const { data, error } = await apiClient.GET(
    '/api/image-gen/generate-images/{imageGenId}/status',
    {
      params: { path: { imageGenId } },
    },
  );

  if (error || !data) {
    throw new Error('Failed to get image gen status');
  }

  return data;
}

export async function generateClue(igdbId: number, provider: string) {
  const { data, error } = await apiClient.POST('/api/clue/generate-clue', {
    body: { igdbId, provider },
  });

  if (error || !data) {
    throw new Error('Failed to generate clue');
  }

  return data;
}

export async function getClueHistory(igdbId: number) {
  const { data, error } = await apiClient.GET('/api/clue/history', {
    params: { query: { igdbId } },
  });

  if (error || !data) {
    throw new Error('Failed to get clue history');
  }

  return data;
}

export async function restoreClue(igdbId: number, historyId: number) {
  const { data, error } = await apiClient.POST('/api/clue/restore', {
    body: { igdbId, historyId },
  });

  if (error || !data) {
    throw new Error('Failed to restore clue');
  }

  return data;
}

export async function validateIgdbIdAdd(igdbId: number, signal?: AbortSignal) {
  const { data, error } = await apiClient.POST('/api/games/add/validate-one', {
    body: { igdbId },
    signal,
  });

  if (error || !data) {
    throw new Error('Failed to validate IGDB ID');
  }

  return data;
}

export async function addGame(igdbId: number) {
  return syncGame(igdbId);
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
