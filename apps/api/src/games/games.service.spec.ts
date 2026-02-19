import { Test, TestingModule } from '@nestjs/testing';
import {
  beforeEach,
  afterEach,
  describe,
  it,
  expect,
  jest,
} from '@jest/globals';
import { GamesService } from '@/games/games.service';
import { DatabaseService } from '@/db/database.service';
import { IgdbService, type IgdbGame } from '@/games/igdb.service';

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;

type ChainableMock = {
  select: jest.Mock;
  from: jest.Mock;
  where: jest.Mock;
  limit: jest.Mock;
  offset: jest.Mock;
  orderBy: jest.Mock;
  update: jest.Mock;
  set: jest.Mock;
  insert: jest.Mock;
  values: jest.Mock;
  delete: jest.Mock;
  returning: jest.Mock;
  execute: AsyncMock;
};

describe('GamesService', () => {
  let service: GamesService;
  let mockDb: ChainableMock;
  let mockDatabaseService: { db: unknown };
  let mockIgdbService: { getGameById: AsyncMock };
  let resolveValue: unknown;

  const buildChainableMock = (getVal: () => unknown): ChainableMock => {
    const spies: ChainableMock = {
      select: jest.fn(),
      from: jest.fn(),
      where: jest.fn(),
      limit: jest.fn(),
      offset: jest.fn(),
      orderBy: jest.fn(),
      update: jest.fn(),
      set: jest.fn(),
      insert: jest.fn(),
      values: jest.fn(),
      delete: jest.fn(),
      returning: jest.fn(),
      execute: jest.fn() as AsyncMock,
    };

    const makeLink = (): Promise<unknown> => {
      const wrappers = {
        select: (...args: unknown[]) => {
          spies.select(...args);
          return makeLink();
        },
        from: (...args: unknown[]) => {
          spies.from(...args);
          return makeLink();
        },
        where: (...args: unknown[]) => {
          spies.where(...args);
          return makeLink();
        },
        limit: (...args: unknown[]) => {
          spies.limit(...args);
          return makeLink();
        },
        offset: (...args: unknown[]) => {
          spies.offset(...args);
          return makeLink();
        },
        orderBy: (...args: unknown[]) => {
          spies.orderBy(...args);
          return makeLink();
        },
        update: (...args: unknown[]) => {
          spies.update(...args);
          return makeLink();
        },
        set: (...args: unknown[]) => {
          spies.set(...args);
          return makeLink();
        },
        insert: (...args: unknown[]) => {
          spies.insert(...args);
          return makeLink();
        },
        values: (...args: unknown[]) => {
          spies.values(...args);
          return makeLink();
        },
        delete: (...args: unknown[]) => {
          spies.delete(...args);
          return makeLink();
        },
        returning: (...args: unknown[]) => {
          spies.returning(...args);
          return makeLink();
        },
        execute: (...args: unknown[]) => spies.execute(...args),
      };
      return Object.assign(Promise.resolve(getVal()), wrappers);
    };

    const chainKeys = [
      'select',
      'from',
      'where',
      'limit',
      'offset',
      'orderBy',
      'update',
      'set',
      'insert',
      'values',
      'delete',
      'returning',
    ] as const;

    chainKeys.forEach((key) => {
      spies[key].mockImplementation(() => {
        return makeLink();
      });
    });

    return spies;
  };

  const createChainableMock = () =>
    buildChainableMock(() => resolveValue ?? []);

  beforeEach(async () => {
    resolveValue = [];
    mockDb = createChainableMock();
    mockDatabaseService = {
      db: mockDb,
    };

    mockIgdbService = {
      getGameById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamesService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: IgdbService,
          useValue: mockIgdbService,
        },
      ],
    }).compile();

    service = module.get<GamesService>(GamesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllGames', () => {
    it('should return all games ordered by descending id', async () => {
      const mockGames = [
        { id: 2, name: 'Game 2', igdbId: 202 },
        { id: 1, name: 'Game 1', igdbId: 101 },
      ];

      resolveValue = mockGames;

      const result = await service.getAllGames();

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.orderBy).toHaveBeenCalled();
      expect(result).toEqual(mockGames);
    });

    it('should return empty array when no games exist', async () => {
      resolveValue = [];

      const result = await service.getAllGames();

      expect(result).toEqual([]);
    });
  });

  describe('getGameByIgdbId', () => {
    it('should return game when found by igdbId', async () => {
      const mockGame = { id: 1, name: 'Game 1', igdbId: 101 };
      resolveValue = [mockGame];

      const result = await service.getGameByIgdbId(101);

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockGame);
    });

    it('should return null when game not found', async () => {
      resolveValue = [];

      const result = await service.getGameByIgdbId(999);

      expect(result).toBeNull();
    });

    it('should return null when array is undefined', async () => {
      resolveValue = undefined;

      const result = await service.getGameByIgdbId(999);

      expect(result).toBeNull();
    });
  });

  describe('getArtworkGames', () => {
    it('should return games with artwork', async () => {
      const mockGames = [
        { id: 1, name: 'Game 1', artworks: [{ url: 'http://example.com' }] },
      ];

      resolveValue = mockGames;

      const result = await service.getArtworkGames();

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.orderBy).toHaveBeenCalled();
      expect(result).toEqual(mockGames);
    });

    it('should return empty array when no artwork games exist', async () => {
      resolveValue = [];

      const result = await service.getArtworkGames();

      expect(result).toEqual([]);
    });
  });

  describe('getGamesPage', () => {
    it('should return paginated games with total count', async () => {
      const mockGames = [
        { id: 1, name: 'Game 1' },
        { id: 2, name: 'Game 2' },
      ];

      resolveValue = mockGames;
      const promiseAllSpy = jest
        .spyOn(Promise, 'all')
        .mockResolvedValue([mockGames, [{ count: 50 }]] as unknown[]);

      const result = await service.getGamesPage(1, 10);

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.limit).toHaveBeenCalledWith(10);
      expect(mockDb.offset).toHaveBeenCalledWith(0);
      expect(result).toEqual({
        games: mockGames,
        total: 50,
      });

      promiseAllSpy.mockRestore();
    });

    it('should calculate correct offset for different pages', async () => {
      const promiseAllSpy = jest
        .spyOn(Promise, 'all')
        .mockResolvedValue([[], [{ count: 0 }]] as unknown[]);

      await service.getGamesPage(3, 20);

      expect(mockDb.offset).toHaveBeenCalledWith(40); // (3-1) * 20

      promiseAllSpy.mockRestore();
    });

    it('should handle search query parameter', async () => {
      const promiseAllSpy = jest
        .spyOn(Promise, 'all')
        .mockResolvedValue([[], [{ count: 0 }]] as unknown[]);

      await service.getGamesPage(1, 10, 'Zelda');

      expect(mockDb.where).toHaveBeenCalled();

      promiseAllSpy.mockRestore();
    });

    it('should return 0 when count is empty', async () => {
      const promiseAllSpy = jest
        .spyOn(Promise, 'all')
        .mockResolvedValue([[], []] as unknown[]);

      const result = await service.getGamesPage(1, 10);

      expect(result.total).toBe(0);

      promiseAllSpy.mockRestore();
    });

    it('should return 0 when count object is undefined', async () => {
      const promiseAllSpy = jest
        .spyOn(Promise, 'all')
        .mockResolvedValue([[], [undefined]] as unknown[]);

      const result = await service.getGamesPage(1, 10);

      expect(result.total).toBe(0);

      promiseAllSpy.mockRestore();
    });
  });

  describe('refreshAllGamesView', () => {
    it('should execute refresh materialized view without throwing', async () => {
      mockDb.execute.mockResolvedValue(undefined);

      await expect(service.refreshAllGamesView()).resolves.not.toThrow();

      expect(mockDb.execute).toHaveBeenCalled();
    });

    it('should catch error and call console.error without throwing', async () => {
      const error = new Error('View refresh failed');
      mockDb.execute.mockRejectedValue(error);
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(service.refreshAllGamesView()).resolves.not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to refresh materialized view',
        error,
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getRandomGame', () => {
    it('should return a random game without excludeIds and mode', async () => {
      const mockGame = { id: 1, name: 'Random Game' };
      resolveValue = [mockGame];

      const result = await service.getRandomGame([]);

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.orderBy).toHaveBeenCalled();
      expect(mockDb.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockGame);
    });

    it('should exclude specified game ids', async () => {
      const mockGame = { id: 3, name: 'Game 3' };
      resolveValue = [mockGame];

      const result = await service.getRandomGame([1, 2]);

      expect(mockDb.where).toHaveBeenCalled();
      expect(result).toEqual(mockGame);
    });

    it('should filter by artwork mode', async () => {
      const mockGame = { id: 1, name: 'Game with Artwork' };
      resolveValue = [mockGame];

      const result = await service.getRandomGame([], 'artwork');

      expect(mockDb.where).toHaveBeenCalled();
      expect(result).toEqual(mockGame);
    });

    it('should filter by cover-art mode', async () => {
      const mockGame = { id: 1, name: 'Game with Cover Art' };
      resolveValue = [mockGame];

      const result = await service.getRandomGame([], 'cover-art');

      expect(mockDb.where).toHaveBeenCalled();
      expect(result).toEqual(mockGame);
    });

    it('should filter by image-gen mode', async () => {
      const mockGame = { id: 1, name: 'Game with Image' };
      resolveValue = [mockGame];

      const result = await service.getRandomGame([], 'image-gen');

      expect(mockDb.where).toHaveBeenCalled();
      expect(result).toEqual(mockGame);
    });

    it('should filter by timeline mode', async () => {
      const mockGame = { id: 1, name: 'Game with Release Date' };
      resolveValue = [mockGame];

      const result = await service.getRandomGame([], 'timeline');

      expect(mockDb.where).toHaveBeenCalled();
      expect(result).toEqual(mockGame);
    });

    it('should filter by timeline-2 mode', async () => {
      const mockGame = { id: 1, name: 'Game with Release Date' };
      resolveValue = [mockGame];

      const result = await service.getRandomGame([], 'timeline-2');

      expect(mockDb.where).toHaveBeenCalled();
      expect(result).toEqual(mockGame);
    });

    it('should return null when no game found', async () => {
      resolveValue = [];

      const result = await service.getRandomGame([]);

      expect(result).toBeNull();
    });

    it('should handle both excludeIds and mode together', async () => {
      const mockGame = { id: 5, name: 'Game 5' };
      resolveValue = [mockGame];

      const result = await service.getRandomGame([1, 2, 3], 'artwork');

      expect(mockDb.where).toHaveBeenCalled();
      expect(result).toEqual(mockGame);
    });
  });

  describe('searchGames', () => {
    it('should return games matching search query', async () => {
      const mockGames = [
        { id: 1, name: 'The Legend of Zelda' },
        { id: 2, name: 'Zelda II: The Adventure of Link' },
      ];
      resolveValue = mockGames;

      const result = await service.searchGames('Zelda', 100);

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.limit).toHaveBeenCalledWith(100);
      expect(mockDb.orderBy).toHaveBeenCalled();
      expect(result).toEqual(mockGames);
    });

    it('should filter by artwork mode when provided', async () => {
      const mockGames = [{ id: 1, name: 'Game with Artwork' }];
      resolveValue = mockGames;

      const result = await service.searchGames('Game', 50, 'artwork');

      expect(mockDb.where).toHaveBeenCalled();
      expect(result).toEqual(mockGames);
    });

    it('should return empty array when no matches found', async () => {
      resolveValue = [];

      const result = await service.searchGames('NonexistentGame', 100);

      expect(result).toEqual([]);
    });

    it('should respect limit parameter', async () => {
      resolveValue = [];

      await service.searchGames('Test', 25);

      expect(mockDb.limit).toHaveBeenCalledWith(25);
    });
  });

  describe('syncGameByIgdbId', () => {
    it('should return null when IGDB game not found', async () => {
      mockIgdbService.getGameById.mockResolvedValue(null);

      const result = await service.syncGameByIgdbId(999);

      expect(result).toBeNull();
    });

    it('should call mapIgdbToGame and insert game', async () => {
      const igdbGame: IgdbGame = {
        id: 101,
        name: 'New Game',
      };

      mockIgdbService.getGameById.mockResolvedValue(igdbGame);

      resolveValue = [];

      jest
        .spyOn(service, 'refreshAllGamesView' as any)
        .mockResolvedValue(undefined);

      await service.syncGameByIgdbId(101);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          igdbId: 101,
          name: 'New Game',
        }),
      );
    });

    it('should call mapIgdbToGame and update game when it exists', async () => {
      const igdbGame: IgdbGame = {
        id: 101,
        name: 'Updated Game',
      };

      const existingGame = { id: 1, igdbId: 101 };

      mockIgdbService.getGameById.mockResolvedValue(igdbGame);

      resolveValue = [existingGame];

      jest
        .spyOn(service, 'refreshAllGamesView' as any)
        .mockResolvedValue(undefined);

      await service.syncGameByIgdbId(101);

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          igdbId: 101,
          name: 'Updated Game',
          updatedAt: expect.any(Date),
        }),
      );
    });
  });

  describe('updateGame', () => {
    it('should update game and refresh view when game found', async () => {
      const updatedGame = { id: 1, name: 'Updated Name' };
      resolveValue = [updatedGame];

      const refreshSpy = jest
        .spyOn(service, 'refreshAllGamesView' as any)
        .mockResolvedValue(undefined);

      const result = await service.updateGame(1, { name: 'Updated Name' });

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(result).toEqual(updatedGame);
      expect(refreshSpy).toHaveBeenCalled();

      refreshSpy.mockRestore();
    });

    it('should return null when game not found and not refresh', async () => {
      resolveValue = [];

      const refreshSpy = jest
        .spyOn(service, 'refreshAllGamesView' as any)
        .mockResolvedValue(undefined);

      const result = await service.updateGame(999, { name: 'Updated' });

      expect(result).toBeNull();
      expect(refreshSpy).not.toHaveBeenCalled();

      refreshSpy.mockRestore();
    });

    it('should include updatedAt timestamp in update', async () => {
      const updatedGame = { id: 1, name: 'Updated' };
      resolveValue = [updatedGame];

      jest
        .spyOn(service, 'refreshAllGamesView' as any)
        .mockResolvedValue(undefined);

      await service.updateGame(1, { name: 'Updated' });

      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated',
          updatedAt: expect.any(Date),
        }),
      );
    });
  });

  describe('deleteGame', () => {
    it('should delete game and return id when game found', async () => {
      const deletedGame = { id: 5 };
      resolveValue = [deletedGame];

      const refreshSpy = jest
        .spyOn(service, 'refreshAllGamesView' as any)
        .mockResolvedValue(undefined);

      const result = await service.deleteGame(5);

      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(result).toBe(5);
      expect(refreshSpy).toHaveBeenCalled();

      refreshSpy.mockRestore();
    });

    it('should return null when game not found and not refresh', async () => {
      resolveValue = [];

      const refreshSpy = jest
        .spyOn(service, 'refreshAllGamesView' as any)
        .mockResolvedValue(undefined);

      const result = await service.deleteGame(999);

      expect(result).toBeNull();
      expect(refreshSpy).not.toHaveBeenCalled();

      refreshSpy.mockRestore();
    });

    it('should return null when deletedGame is undefined', async () => {
      resolveValue = [undefined];

      const refreshSpy = jest
        .spyOn(service, 'refreshAllGamesView' as any)
        .mockResolvedValue(undefined);

      const result = await service.deleteGame(1);

      expect(result).toBeNull();

      refreshSpy.mockRestore();
    });
  });

  describe('deleteGames', () => {
    it('should delete multiple games and return ids when rows deleted', async () => {
      const deletedRows = [{ id: 1 }, { id: 2 }, { id: 3 }];
      resolveValue = deletedRows;

      const refreshSpy = jest
        .spyOn(service, 'refreshAllGamesView' as any)
        .mockResolvedValue(undefined);

      const result = await service.deleteGames([1, 2, 3]);

      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(result).toEqual([1, 2, 3]);
      expect(refreshSpy).toHaveBeenCalled();

      refreshSpy.mockRestore();
    });

    it('should not refresh view when no rows deleted', async () => {
      resolveValue = [];

      const refreshSpy = jest
        .spyOn(service, 'refreshAllGamesView' as any)
        .mockResolvedValue(undefined);

      const result = await service.deleteGames([1, 2, 3]);

      expect(result).toEqual([]);
      expect(refreshSpy).not.toHaveBeenCalled();

      refreshSpy.mockRestore();
    });

    it('should extract ids from deleted rows', async () => {
      const deletedRows = [{ id: 10 }, { id: 20 }];
      resolveValue = deletedRows;

      jest
        .spyOn(service, 'refreshAllGamesView' as any)
        .mockResolvedValue(undefined);

      const result = await service.deleteGames([10, 20]);

      expect(result).toEqual([10, 20]);
    });
  });

  describe('mapIgdbToGame (tested indirectly via syncGameByIgdbId)', () => {
    const setupSyncMock = (initialResolve: unknown, secondResolve: unknown) => {
      const syncSpies: ChainableMock = {
        select: jest.fn(),
        from: jest.fn(),
        where: jest.fn(),
        limit: jest.fn(),
        offset: jest.fn(),
        orderBy: jest.fn(),
        update: jest.fn(),
        set: jest.fn(),
        insert: jest.fn(),
        values: jest.fn(),
        delete: jest.fn(),
        returning: jest.fn(),
        execute: jest.fn() as AsyncMock,
      };

      const makeLink = (): Promise<unknown> =>
        Object.assign(Promise.resolve(undefined), {
          select: (...a: unknown[]) => {
            syncSpies.select(...a);
            return makeLink();
          },
          from: (...a: unknown[]) => {
            syncSpies.from(...a);
            return makeLink();
          },
          where: (...a: unknown[]) => {
            syncSpies.where(...a);
            return makeLink();
          },
          limit: (...a: unknown[]) => {
            syncSpies.limit(...a);
            return Promise.resolve(initialResolve);
          },
          offset: (...a: unknown[]) => {
            syncSpies.offset(...a);
            return makeLink();
          },
          orderBy: (...a: unknown[]) => {
            syncSpies.orderBy(...a);
            return makeLink();
          },
          update: (...a: unknown[]) => {
            syncSpies.update(...a);
            return makeLink();
          },
          set: (...a: unknown[]) => {
            syncSpies.set(...a);
            return makeLink();
          },
          insert: (...a: unknown[]) => {
            syncSpies.insert(...a);
            return makeLink();
          },
          values: (...a: unknown[]) => {
            syncSpies.values(...a);
            return makeLink();
          },
          delete: (...a: unknown[]) => {
            syncSpies.delete(...a);
            return makeLink();
          },
          returning: (...a: unknown[]) => {
            syncSpies.returning(...a);
            return Promise.resolve(secondResolve);
          },
          execute: (...a: unknown[]) => syncSpies.execute(...a),
        });

      (
        [
          'select',
          'from',
          'where',
          'offset',
          'orderBy',
          'update',
          'set',
          'insert',
          'values',
          'delete',
        ] as const
      ).forEach((key) => {
        syncSpies[key].mockImplementation(() => makeLink());
      });
      syncSpies.limit.mockImplementation(() => Promise.resolve(initialResolve));
      syncSpies.returning.mockImplementation(() =>
        Promise.resolve(secondResolve),
      );

      mockDb = syncSpies;
      mockDatabaseService.db = mockDb;
    };

    it('should format cover url with https protocol when missing', async () => {
      const igdbGame: IgdbGame = {
        id: 101,
        name: 'Game',
        cover: { url: '//images.igdb.com/thumb.jpg' },
      };

      const newGame = { id: 1, igdbId: 101, name: 'Game' };

      mockIgdbService.getGameById.mockResolvedValue(igdbGame);
      setupSyncMock([], [newGame]);

      jest
        .spyOn(service, 'refreshAllGamesView' as any)
        .mockResolvedValue(undefined);

      await service.syncGameByIgdbId(101);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: expect.stringContaining('https://'),
        }),
      );
    });

    it('should replace t_thumb with t_720p in image urls', async () => {
      const igdbGame: IgdbGame = {
        id: 101,
        name: 'Game',
        cover: { url: 'https://example.com/t_thumb/image.jpg' },
      };

      const newGame = { id: 1, igdbId: 101, name: 'Game' };

      mockIgdbService.getGameById.mockResolvedValue(igdbGame);
      setupSyncMock([], [newGame]);

      jest
        .spyOn(service, 'refreshAllGamesView' as any)
        .mockResolvedValue(undefined);

      await service.syncGameByIgdbId(101);

      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: expect.stringContaining('t_720p'),
        }),
      );
    });

    it('should handle undefined cover url', async () => {
      const igdbGame: IgdbGame = {
        id: 101,
        name: 'Game',
      };

      const newGame = { id: 1, igdbId: 101, name: 'Game' };

      mockIgdbService.getGameById.mockResolvedValue(igdbGame);
      setupSyncMock([], [newGame]);

      jest
        .spyOn(service, 'refreshAllGamesView' as any)
        .mockResolvedValue(undefined);

      await service.syncGameByIgdbId(101);

      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: undefined,
        }),
      );
    });

    it('should format artwork urls the same as cover urls', async () => {
      const igdbGame: IgdbGame = {
        id: 101,
        name: 'Game',
        artworks: [
          { url: '//images.igdb.com/t_thumb/art1.jpg' },
          { url: 'https://example.com/t_thumb/art2.jpg' },
        ],
      };

      const newGame = { id: 1, igdbId: 101, name: 'Game' };

      mockIgdbService.getGameById.mockResolvedValue(igdbGame);
      setupSyncMock([], [newGame]);

      jest
        .spyOn(service, 'refreshAllGamesView' as any)
        .mockResolvedValue(undefined);

      await service.syncGameByIgdbId(101);

      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          artworks: expect.arrayContaining([
            expect.objectContaining({
              url: expect.stringContaining('https://'),
            }),
          ]),
        }),
      );
    });

    it('should map all game fields from IGDB data', async () => {
      const igdbGame: IgdbGame = {
        id: 101,
        name: 'Complete Game',
        summary: 'A great game',
        storyline: 'An epic story',
        url: 'https://igdb.com/game/101',
        total_rating: 85,
        total_rating_count: 1000,
        first_release_date: 1609459200,
        platforms: [{ name: 'PC' }, { name: 'PlayStation' }],
        genres: [{ name: 'Action' }],
        themes: [{ name: 'Sci-Fi' }],
        game_modes: [{ name: 'Single player' }],
        player_perspectives: [{ name: 'Third person' }],
        game_engines: [{ name: 'Unreal Engine' }],
        keywords: [{ name: 'adventure' }],
        franchises: [{ name: 'Final Fantasy' }],
        involved_companies: [
          {
            company: { name: 'Square Enix' },
            developer: true,
            publisher: false,
          },
        ],
        release_dates: [
          {
            date: 1609459200,
            platform: { name: 'PC' },
          },
        ],
      };

      const newGame = { id: 1, igdbId: 101, name: 'Complete Game' };

      mockIgdbService.getGameById.mockResolvedValue(igdbGame);
      setupSyncMock([], [newGame]);

      jest
        .spyOn(service, 'refreshAllGamesView' as any)
        .mockResolvedValue(undefined);

      await service.syncGameByIgdbId(101);

      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          igdbId: 101,
          name: 'Complete Game',
          summary: 'A great game',
          storyline: 'An epic story',
          firstReleaseDate: 1609459200,
          platforms: ['PC', 'PlayStation'],
          genres: ['Action'],
          themes: ['Sci-Fi'],
          gameModes: ['Single player'],
          playerPerspectives: ['Third person'],
          gameEngines: ['Unreal Engine'],
          keywords: ['adventure'],
          franchises: ['Final Fantasy'],
          involvedCompanies: [
            {
              name: 'Square Enix',
              developer: true,
              publisher: false,
            },
          ],
          releaseDates: [
            {
              date: 1609459200,
              platform: 'PC',
            },
          ],
          info: {
            url: 'https://igdb.com/game/101',
            rating: 85,
            ratingCount: 1000,
          },
        }),
      );
    });
  });
});
