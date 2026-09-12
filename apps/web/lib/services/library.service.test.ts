import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getEpicLibraryGames } from './library.service';

describe('library.service', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('fetches epic library games successfully', async () => {
    const mockGames = [
      { id: 1, name: 'Alan Wake 2', epic: true, epicDemo: false },
      { id: 2, name: 'The Matrix Awakens Demo', epic: true, epicDemo: true },
    ];

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockGames }),
    } as Response);

    const result = await getEpicLibraryGames();
    expect(result).toEqual(mockGames);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/private/libraries/epic',
      expect.any(Object),
    );
  });

  it('throws an error if response is not ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Database failure' }),
    } as Response);

    await expect(getEpicLibraryGames()).rejects.toThrow('Database failure');
  });

  it('returns empty array if data is missing', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const result = await getEpicLibraryGames();
    expect(result).toEqual([]);
  });
});
