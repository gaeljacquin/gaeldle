import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@/lib/api-client', () => ({
  apiClient: {},
}));

import {
  getRandomGame,
  getRandomGames,
  searchGames,
  getPaginatedGames,
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
});
