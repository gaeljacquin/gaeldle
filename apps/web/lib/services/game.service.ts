import { apiClient } from '@/lib/api-client';
import type { Game, ArtStyleValue } from '@workspace/db';
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

export async function updateGameHidden(
  id: number,
  hidden: boolean,
): Promise<boolean> {
  const { data, error } = await apiClient.PATCH('/api/games/{id}', {
    params: { path: { id } },
    body: { hidden },
  });

  if (error || !data) {
    throw new Error('Failed to update game hidden status');
  }

  return data.success;
}

export type WishlistKey =
  | 'steamWishlist'
  | 'epicWishlist'
  | 'nintendoWishlist'
  | 'xboxWishlist'
  | 'humbleBundleWishlist';

export async function updateGameWishlist(
  id: number,
  wishlistKey: WishlistKey,
  value: boolean,
): Promise<boolean> {
  const { data, error } = await apiClient.PATCH('/api/games/{id}', {
    params: { path: { id } },
    body: { [wishlistKey]: value },
  });

  if (error || !data) {
    throw new Error('Failed to update game wishlist status');
  }

  return data.success;
}

export async function updateBulkGamesHidden(
  ids: number[],
  hidden: boolean,
): Promise<boolean> {
  const { data, error } = await apiClient.PATCH('/api/games/bulk', {
    body: { ids, hidden },
  });

  if (error || !data) {
    throw new Error('Failed to bulk update games hidden status');
  }

  return data.success;
}

export async function updateBulkGamesWishlist(
  ids: number[],
  wishlistKey: WishlistKey,
  value: boolean,
): Promise<boolean> {
  const { data, error } = await apiClient.PATCH('/api/games/bulk', {
    body: { ids, [wishlistKey]: value },
  });

  if (error || !data) {
    throw new Error('Failed to bulk update games wishlist status');
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

export type SortField = 'name' | 'firstReleaseDate' | 'igdbId' | 'createdAt';

export function buildPaginatedGamesUrl(
  endpoint: string,
  page: number = 1,
  pageSize: number = 10,
  query?: string,
  sortBy: SortField = 'name',
  sortDir: 'asc' | 'desc' = 'asc',
  igdbId?: string,
  extraParams?: Record<string, string | undefined>,
): string {
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

  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value !== undefined) {
        params.set(key, value);
      }
    }
  }

  return endpoint + '?' + params.toString();
}

export async function fetchPaginatedGames(
  endpoint: string,
  page: number = 1,
  pageSize: number = 10,
  query?: string,
  sortBy: SortField = 'name',
  sortDir: 'asc' | 'desc' = 'asc',
  igdbId?: string,
  extraParams?: Record<string, string | undefined>,
): Promise<PaginatedResponse<Game>> {
  const url = buildPaginatedGamesUrl(
    endpoint,
    page,
    pageSize,
    query,
    sortBy,
    sortDir,
    igdbId,
    extraParams,
  );
  const response = await fetchWithTimeout(url);

  return handleResponse<PaginatedResponse<Game>>(response);
}

export function makePaginatedPlatformQueryOptions(
  queryKey: string,
  endpoint: string,
) {
  return (
    page: number = 1,
    pageSize: number = 10,
    query?: string,
    sortBy: SortField = 'name',
    sortDir: 'asc' | 'desc' = 'asc',
    igdbId?: string,
    extraParams?: Record<string, string | undefined>,
  ) => ({
    queryKey: [
      queryKey,
      { page, pageSize, query, sortBy, sortDir, igdbId, ...extraParams },
    ],
    queryFn: () =>
      fetchPaginatedGames(
        endpoint,
        page,
        pageSize,
        query,
        sortBy,
        sortDir,
        igdbId,
        extraParams,
      ),
  });
}

export async function getPaginatedGames(
  page: number = 1,
  pageSize: number = 10,
  query?: string,
  sortBy: SortField = 'name',
  sortDir: 'asc' | 'desc' = 'asc',
  igdbId?: string,
  filter?: string,
): Promise<PaginatedResponse<Game>> {
  return fetchPaginatedGames(
    '/api/games',
    page,
    pageSize,
    query,
    sortBy,
    sortDir,
    igdbId,
    filter ? { filter } : undefined,
  );
}

export const getPaginatedGogGames = (
  page: number = 1,
  pageSize: number = 10,
  query?: string,
  sortBy: SortField = 'name',
  sortDir: 'asc' | 'desc' = 'asc',
  igdbId?: string,
) =>
  fetchPaginatedGames(
    '/api/private/libraries/gog',
    page,
    pageSize,
    query,
    sortBy,
    sortDir,
    igdbId,
  );

export const getPaginatedHumbleBundleWishlist = (
  page: number = 1,
  pageSize: number = 10,
  query?: string,
  sortBy: SortField = 'name',
  sortDir: 'asc' | 'desc' = 'asc',
  igdbId?: string,
) =>
  fetchPaginatedGames(
    '/api/private/wishlists/humble-bundle',
    page,
    pageSize,
    query,
    sortBy,
    sortDir,
    igdbId,
  );

export const getPaginatedNintendoWishlistGames = (
  page: number = 1,
  pageSize: number = 10,
  query?: string,
  sortBy: SortField = 'name',
  sortDir: 'asc' | 'desc' = 'asc',
  igdbId?: string,
) =>
  fetchPaginatedGames(
    '/api/private/wishlists/nintendo',
    page,
    pageSize,
    query,
    sortBy,
    sortDir,
    igdbId,
  );

export const getPaginatedSteamWishlistGames = (
  page: number = 1,
  pageSize: number = 10,
  query?: string,
  sortBy: SortField = 'name',
  sortDir: 'asc' | 'desc' = 'asc',
  igdbId?: string,
) =>
  fetchPaginatedGames(
    '/api/private/wishlists/steam',
    page,
    pageSize,
    query,
    sortBy,
    sortDir,
    igdbId,
  );

export const getPaginatedEpicWishlistGames = (
  page: number = 1,
  pageSize: number = 10,
  query?: string,
  sortBy: SortField = 'name',
  sortDir: 'asc' | 'desc' = 'asc',
  igdbId?: string,
) =>
  fetchPaginatedGames(
    '/api/private/wishlists/epic',
    page,
    pageSize,
    query,
    sortBy,
    sortDir,
    igdbId,
  );

export const getPaginatedXboxGames = (
  page: number = 1,
  pageSize: number = 10,
  query?: string,
  sortBy: SortField = 'name',
  sortDir: 'asc' | 'desc' = 'asc',
  igdbId?: string,
) =>
  fetchPaginatedGames(
    '/api/private/libraries/xbox',
    page,
    pageSize,
    query,
    sortBy,
    sortDir,
    igdbId,
  );

export const getXboxWishlistGames = (
  page: number = 1,
  pageSize: number = 10,
  query?: string,
  sortBy: SortField = 'name',
  sortDir: 'asc' | 'desc' = 'asc',
  igdbId?: string,
) =>
  getPaginatedGames(
    page,
    pageSize,
    query,
    sortBy,
    sortDir,
    igdbId,
    'xboxWishlist',
  );

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
    console.error(error);
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

export const paginatedGogGamesQueryOptions = makePaginatedPlatformQueryOptions(
  'gog-games',
  '/api/private/libraries/gog',
);

export const paginatedNintendoWishlistGamesQueryOptions =
  makePaginatedPlatformQueryOptions(
    'nintendoWishlistGames',
    '/api/private/wishlists/nintendo',
  );

export const humbleBundleWishlistQueryOptions =
  makePaginatedPlatformQueryOptions(
    'wishlist-humble-bundle',
    '/api/private/wishlists/humble-bundle',
  );

export const paginatedEpicWishlistGamesQueryOptions =
  makePaginatedPlatformQueryOptions(
    'epicWishlistGames',
    '/api/private/wishlists/epic',
  );
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

export const getPaginatedAmazonGames = (
  page: number = 1,
  pageSize: number = 10,
  query?: string,
  sortBy: SortField = 'name',
  sortDir: 'asc' | 'desc' = 'asc',
  igdbId?: string,
): Promise<PaginatedResponse<Game>> =>
  fetchPaginatedGames(
    '/api/private/libraries/amazon',
    page,
    pageSize,
    query,
    sortBy,
    sortDir,
    igdbId,
  );

export const paginatedAmazonGamesQueryOptions =
  makePaginatedPlatformQueryOptions(
    'amazon-games',
    '/api/private/libraries/amazon',
  );

export const paginatedXboxGamesQueryOptions = makePaginatedPlatformQueryOptions(
  'library-xbox-games',
  '/api/private/libraries/xbox',
);

export const paginatedXboxWishlistGamesQueryOptions = (
  page: number = 1,
  pageSize: number = 10,
  query?: string,
  sortBy: SortField = 'name',
  sortDir: 'asc' | 'desc' = 'asc',
  igdbId?: string,
) => ({
  queryKey: [
    'wishlist-xbox',
    { page, pageSize, query, sortBy, sortDir, igdbId },
  ],
  queryFn: () =>
    getXboxWishlistGames(page, pageSize, query, sortBy, sortDir, igdbId),
});

export type NintendoFilter = 'all' | 'owned' | 'demos';

export const getNintendoGames = (
  page: number = 1,
  pageSize: number = 10,
  query?: string,
  sortBy: SortField = 'name',
  sortDir: 'asc' | 'desc' = 'asc',
  igdbId?: string,
  filter: NintendoFilter = 'all',
): Promise<PaginatedResponse<Game>> =>
  fetchPaginatedGames(
    '/api/private/libraries/nintendo',
    page,
    pageSize,
    query,
    sortBy,
    sortDir,
    igdbId,
    { filter },
  );

export const nintendoGamesQueryOptions = (
  page: number = 1,
  pageSize: number = 10,
  query?: string,
  sortBy: SortField = 'name',
  sortDir: 'asc' | 'desc' = 'asc',
  igdbId?: string,
  filter: NintendoFilter = 'all',
) => ({
  queryKey: [
    'nintendo-games',
    { page, pageSize, query, sortBy, sortDir, igdbId, filter },
  ],
  queryFn: () =>
    getNintendoGames(page, pageSize, query, sortBy, sortDir, igdbId, filter),
});

export type SteamFilter = 'all' | 'owned' | 'demos';

export async function getSteamGames(filter?: SteamFilter): Promise<Game[]> {
  const params = new URLSearchParams();
  if (filter && filter !== 'all') {
    params.set('filter', filter);
  }
  const queryString = params.toString();
  const url =
    '/api/private/libraries/steam' + (queryString ? `?${queryString}` : '');
  const response = await fetchWithTimeout(url);
  const result = await handleResponse<{ success: boolean; data: Game[] }>(
    response,
  );

  return result.data;
}

export const steamGamesQueryOptions = (filter?: SteamFilter) => ({
  queryKey: ['steamGames', filter ?? 'all'],
  queryFn: () => getSteamGames(filter),
});

export const paginatedSteamWishlistGamesQueryOptions =
  makePaginatedPlatformQueryOptions(
    'steamWishlistGames',
    '/api/private/wishlists/steam',
  );

export async function getWishlistLastUpdated(
  wishlist: WishlistKey | string,
): Promise<string | null> {
  const url = `/api/private/wishlists/last-updated?wishlist=${encodeURIComponent(wishlist)}`;
  const response = await fetchWithTimeout(url);
  const result = await handleResponse<{
    success: boolean;
    lastUpdatedAt: string | null;
  }>(response);

  return result.lastUpdatedAt ?? null;
}

export const wishlistLastUpdatedQueryOptions = (
  wishlist: WishlistKey | string,
) => ({
  queryKey: ['wishlist-last-updated', wishlist],
  queryFn: () => getWishlistLastUpdated(wishlist),
});

export function formatWishlistLastUpdated(
  date: Date | string | null | undefined,
): string | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `Last updated at ${yyyy}/${mm}/${dd}`;
}
