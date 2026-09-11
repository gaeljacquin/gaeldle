import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    PATCH: vi.fn(),
  },
}));

import { apiClient } from '@/lib/api-client';
import {
  getRandomGame,
  getRandomGames,
  searchGames,
  getPaginatedGames,
  getPaginatedAmazonGames,
  getPaginatedGogGames,
  getNintendoGames,
  getPaginatedNintendoWishlistGames,
  getPaginatedEpicWishlistGames,
  updateGameWishlist,
  updateBulkGamesWishlist,
} from './game.service';
import { gameObject, gameModeGameObject } from '@workspace/db';

const EXCLUDED_FIELDS = [
  'steam',
  'epic',
  'gog',
  'nintendo',
  'amazon',
  'microsoft',
  'xbox',
  'steamDemo',
  'epicDemo',
  'nintendoDemo',
  'hidden',
  'steamWishlist',
  'epicWishlist',
  'nintendoWishlist',
  'xboxWishlist',
  'humbleBundleWishlist',
] as const;

describe('gameModeGameObject field exclusion', () => {
  it('should not contain any of the excluded fields in gameModeGameObject', () => {
    const gameModeKeys = Object.keys(gameModeGameObject);

    for (const field of EXCLUDED_FIELDS) {
      expect(gameModeKeys).not.toContain(field);
    }
  });

  it('should still contain all of the excluded fields in gameObject for admin use', () => {
    const adminKeys = Object.keys(gameObject);

    for (const field of EXCLUDED_FIELDS) {
      expect(adminKeys).toContain(field);
    }
  });

  it('should include core gameplay fields in gameModeGameObject', () => {
    const gameModeKeys = Object.keys(gameModeGameObject);

    expect(gameModeKeys).toContain('id');
    expect(gameModeKeys).toContain('igdbId');
    expect(gameModeKeys).toContain('name');
    expect(gameModeKeys).toContain('imageUrl');
    expect(gameModeKeys).toContain('aiImageUrl');
    expect(gameModeKeys).toContain('clue');
    expect(gameModeKeys).toContain('artworks');
    expect(gameModeKeys).toContain('genres');
    expect(gameModeKeys).toContain('platforms');
    expect(gameModeKeys).toContain('themes');
    expect(gameModeKeys).toContain('firstReleaseDate');
  });
});

describe('game fetching in game modes vs admin', () => {
  const mockGameModeGame = {
    id: 1,
    igdbId: 101,
    name: 'Super Mario Odyssey',
    imageUrl: 'https://example.com/cover.jpg',
    firstReleaseDate: '2017-10-27',
  };

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.startsWith('/api/games/random')) {
          if (url.includes('count=')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ data: [mockGameModeGame] }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockGameModeGame }),
          });
        }
        if (url.startsWith('/api/games/search')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: [mockGameModeGame] }),
          });
        }
        if (url.startsWith('/api/games?')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: [{ ...mockGameModeGame, nintendo: true }],
                meta: { total: 1, page: 1, pageSize: 10 },
              }),
          });
        }
        if (url.startsWith('/api/private/libraries/amazon?')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: [{ ...mockGameModeGame, amazon: true }],
                meta: { total: 1, page: 1, pageSize: 10 },
              }),
          });
        }
        if (url.startsWith('/api/private/libraries/gog?')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: [{ ...mockGameModeGame, gog: true }],
                meta: { total: 1, page: 1, pageSize: 10 },
              }),
          });
        }
        if (url.startsWith('/api/private/wishlists/nintendo?')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: [{ ...mockGameModeGame, nintendoWishlist: true }],
                meta: { total: 1, page: 1, pageSize: 10 },
              }),
          });
        }
        if (url.startsWith('/api/private/wishlists/epic?')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: [{ ...mockGameModeGame, epicWishlist: true }],
                meta: { total: 1, page: 1, pageSize: 10 },
              }),
          });
        }
        return Promise.reject(new Error('Unknown fetch URL: ' + url));
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch random game answer without excluded fields in game modes', async () => {
    const game = await getRandomGame([], 'cover-art');

    expect(game).toBeDefined();
    expect(game.name).toBe('Super Mario Odyssey');
    for (const field of EXCLUDED_FIELDS) {
      expect(game).not.toHaveProperty(field);
    }
  });

  it('should fetch random game list (e.g. timeline) without excluded fields', async () => {
    const games = await getRandomGames(1, [], 'timeline');

    expect(games).toHaveLength(1);
    expect(games[0].name).toBe('Super Mario Odyssey');
    for (const field of EXCLUDED_FIELDS) {
      expect(games[0]).not.toHaveProperty(field);
    }
  });

  it('should search game list in game modes without excluded fields', async () => {
    const games = await searchGames('Mario', 10, 'cover-art');

    expect(games).toHaveLength(1);
    expect(games[0].name).toBe('Super Mario Odyssey');
    for (const field of EXCLUDED_FIELDS) {
      expect(games[0]).not.toHaveProperty(field);
    }
  });

  it('should allow admin paginated games to include store/wishlist fields', async () => {
    const response = await getPaginatedGames(1, 10);

    expect(response.data[0]).toHaveProperty('nintendo', true);
  });

  it('should allow fetching paginated amazon games with amazon field', async () => {
    const response = await getPaginatedAmazonGames(1, 10);

    expect(response.data[0]).toHaveProperty('amazon', true);
    expect(response.meta.total).toBe(1);
  });

  it('should fetch paginated GOG library games with gog property', async () => {
    const response = await getPaginatedGogGames(1, 10);

    expect(response.data[0]).toHaveProperty('gog', true);
    expect(response.meta.total).toBe(1);
  });

  it('should fetch Nintendo library games with default parameters', async () => {
    let requestedUrl = '';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        requestedUrl = url;
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                { ...mockGameModeGame, nintendo: true, nintendoDemo: false },
              ],
              meta: { total: 1, page: 1, pageSize: 10 },
            }),
        });
      }),
    );

    const response = await getNintendoGames();

    expect(requestedUrl).toContain('/api/private/libraries/nintendo');
    expect(requestedUrl).toContain('page=1');
    expect(requestedUrl).toContain('pageSize=10');
    expect(requestedUrl).toContain('filter=all');
    expect(response.data).toHaveLength(1);
    expect(response.data[0].nintendo).toBe(true);
  });

  it('should fetch Nintendo library games with custom filter and query', async () => {
    let requestedUrl = '';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        requestedUrl = url;
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                { ...mockGameModeGame, nintendo: true, nintendoDemo: true },
              ],
              meta: { total: 1, page: 2, pageSize: 25 },
            }),
        });
      }),
    );

    const response = await getNintendoGames(
      2,
      25,
      'Zelda',
      'firstReleaseDate',
      'desc',
      '123',
      'demos',
    );

    expect(requestedUrl).toContain('page=2');
    expect(requestedUrl).toContain('pageSize=25');
    expect(requestedUrl).toContain('q=Zelda');
    expect(requestedUrl).toContain('sortBy=firstReleaseDate');
    expect(requestedUrl).toContain('sortDir=desc');
    expect(requestedUrl).toContain('igdbId=123');
    expect(requestedUrl).toContain('filter=demos');
    expect(response.data[0].nintendoDemo).toBe(true);
  });

  it('should allow fetching paginated nintendo wishlist games', async () => {
    const response = await getPaginatedNintendoWishlistGames(1, 10);

    expect(response.data[0]).toHaveProperty('nintendoWishlist', true);
  });

  it('should allow fetching paginated epic wishlist games', async () => {
    const response = await getPaginatedEpicWishlistGames(1, 10);

    expect(response.data[0]).toHaveProperty('epicWishlist', true);
  });
});

describe('updateGameWishlist', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call apiClient.PATCH with correct path and body to update wishlist status', async () => {
    vi.mocked(apiClient.PATCH).mockResolvedValue({
      data: { success: true },
      error: undefined,
    } as unknown as Awaited<ReturnType<typeof apiClient.PATCH>>);

    const result = await updateGameWishlist(42, 'steamWishlist', false);

    expect(apiClient.PATCH).toHaveBeenCalledWith('/api/games/{id}', {
      params: { path: { id: 42 } },
      body: { steamWishlist: false },
    });
    expect(result).toBe(true);
  });

  it('should throw an error when apiClient returns an error', async () => {
    vi.mocked(apiClient.PATCH).mockResolvedValue({
      data: undefined,
      error: { message: 'Something went wrong' },
    } as unknown as Awaited<ReturnType<typeof apiClient.PATCH>>);

    await expect(updateGameWishlist(42, 'epicWishlist', false)).rejects.toThrow(
      'Failed to update game wishlist status',
    );
  });

  it('should work for all wishlist types', async () => {
    vi.mocked(apiClient.PATCH).mockResolvedValue({
      data: { success: true },
      error: undefined,
    } as unknown as Awaited<ReturnType<typeof apiClient.PATCH>>);

    await updateGameWishlist(1, 'nintendoWishlist', false);
    expect(apiClient.PATCH).toHaveBeenCalledWith('/api/games/{id}', {
      params: { path: { id: 1 } },
      body: { nintendoWishlist: false },
    });

    await updateGameWishlist(2, 'xboxWishlist', false);
    expect(apiClient.PATCH).toHaveBeenCalledWith('/api/games/{id}', {
      params: { path: { id: 2 } },
      body: { xboxWishlist: false },
    });

    await updateGameWishlist(3, 'humbleBundleWishlist', false);
    expect(apiClient.PATCH).toHaveBeenCalledWith('/api/games/{id}', {
      params: { path: { id: 3 } },
      body: { humbleBundleWishlist: false },
    });
  });
});

describe('updateBulkGamesWishlist', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call apiClient.PATCH with correct body to update bulk wishlist status', async () => {
    vi.mocked(apiClient.PATCH).mockResolvedValue({
      data: { success: true },
      error: undefined,
    } as unknown as Awaited<ReturnType<typeof apiClient.PATCH>>);

    const result = await updateBulkGamesWishlist(
      [1, 2, 3],
      'steamWishlist',
      false,
    );

    expect(apiClient.PATCH).toHaveBeenCalledWith('/api/games/bulk', {
      body: { ids: [1, 2, 3], steamWishlist: false },
    });
    expect(result).toBe(true);
  });

  it('should throw an error when bulk update fails', async () => {
    vi.mocked(apiClient.PATCH).mockResolvedValue({
      data: undefined,
      error: { message: 'Bulk update failed' },
    } as unknown as Awaited<ReturnType<typeof apiClient.PATCH>>);

    await expect(
      updateBulkGamesWishlist([1, 2], 'epicWishlist', false),
    ).rejects.toThrow('Failed to bulk update games wishlist status');
  });
});
