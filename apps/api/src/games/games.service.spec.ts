import { Test, TestingModule } from '@nestjs/testing';
import {
  beforeEach,
  afterEach,
  describe,
  it,
  expect,
  jest,
} from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { GamesService } from '@/games/games.service';
import { DatabaseService } from '@/db/database.service';
import { IgdbService, type IgdbGame } from '@/lib/igdb.service';
import { AiService } from '@/lib/ai.service';
import { S3Service } from '@/lib/s3.service';
import { R2Service } from '@/lib/r2.service';
import { domainEvents, queriedGames } from '@workspace/api-contract';

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
      execute: jest.fn(),
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
        {
          provide: AiService,
          useValue: { generateImage: jest.fn() },
        },
        {
          provide: S3Service,
          useValue: { uploadImage: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: R2Service,
          useValue: { r2PublicUrl: 'https://test-r2-public-url.com' },
        },
      ],
    }).compile();

    service = module.get<GamesService>(GamesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
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

  describe('refreshAllGamesView', () => {
    it('should execute refresh materialized view without throwing', async () => {
      mockDb.execute.mockResolvedValue(undefined);

      await expect(service.refreshAllGamesView()).resolves.toBeUndefined();

      expect(mockDb.execute).toHaveBeenCalled();
    });

    it('should catch error and call console.error without throwing', async () => {
      const error = new Error('View refresh failed');
      mockDb.execute.mockRejectedValue(error);
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(service.refreshAllGamesView()).resolves.toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to refresh materialized view',
        error,
      );

      consoleErrorSpy.mockRestore();
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

    it('should use pre-fetched game info from domain events and not call IGDB', async () => {
      const mockGameInfo = {
        igdbId: 101,
        name: 'Event Cached Game',
      };

      resolveValue = {
        then(resolve: any) {
          const lastFromCall =
            mockDb.from.mock.calls[mockDb.from.mock.calls.length - 1];
          const queriedTable = lastFromCall?.[0];

          if (queriedTable === domainEvents) {
            resolve([
              {
                id: 1,
                eventType: 'game.queried',
                payload: {
                  igdbId: 101,
                  gameInfo: mockGameInfo,
                },
              },
            ]);
          } else {
            resolve([]);
          }
        },
      };

      jest
        .spyOn(service, 'refreshAllGamesView' as any)
        .mockResolvedValue(undefined);

      await service.syncGameByIgdbId(101);

      expect(mockIgdbService.getGameById).not.toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          igdbId: 101,
          name: 'Event Cached Game',
        }),
      );
    });
  });

  describe('validateGameForAdd', () => {
    it('should return alreadyInDb true if game exists in db', async () => {
      resolveValue = [{ id: 1, name: 'Existing Game' }];

      const result = await service.validateGameForAdd(101, 'user-1');

      expect(result).toEqual({
        igdbId: 101,
        existsOnIgdb: true,
        alreadyInDb: true,
        gameName: 'Existing Game',
        canAdd: false,
      });

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'game.queried',
          actorId: 'user-1',
          payload: expect.objectContaining({
            igdbId: 101,
            gameName: 'Existing Game',
            found: true,
            alreadyInDb: true,
          }),
        }),
      );
    });

    it('should return existsOnIgdb false if game does not exist on IGDB', async () => {
      resolveValue = [];
      mockIgdbService.getGameById.mockResolvedValue(null);

      const result = await service.validateGameForAdd(101, 'user-1');

      expect(result).toEqual({
        igdbId: 101,
        existsOnIgdb: false,
        alreadyInDb: false,
        gameName: null,
        canAdd: false,
      });

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'game.queried',
          actorId: 'user-1',
          payload: expect.objectContaining({
            igdbId: 101,
            found: false,
            alreadyInDb: false,
          }),
        }),
      );
    });

    it('should return found and save gameInfo if game is found on IGDB', async () => {
      resolveValue = [];
      const igdbGame: IgdbGame = {
        id: 101,
        name: 'New Game',
      };
      mockIgdbService.getGameById.mockResolvedValue(igdbGame);

      const result = await service.validateGameForAdd(101, 'user-1');

      expect(result).toEqual({
        igdbId: 101,
        existsOnIgdb: true,
        alreadyInDb: false,
        gameName: 'New Game',
        canAdd: true,
      });

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'game.queried',
          actorId: 'user-1',
          payload: expect.objectContaining({
            igdbId: 101,
            gameName: 'New Game',
            found: true,
            alreadyInDb: false,
            gameInfo: expect.objectContaining({
              igdbId: 101,
              name: 'New Game',
            }),
          }),
        }),
      );
    });

    it('should return found and not query IGDB if game is found in queriedGames materialized view', async () => {
      resolveValue = {
        then(resolve: any) {
          const lastFromCall =
            mockDb.from.mock.calls[mockDb.from.mock.calls.length - 1];
          const queriedTable = lastFromCall?.[0];

          if (queriedTable === queriedGames) {
            resolve([
              {
                igdbId: 101,
                name: 'Cached View Game',
                gameInfo: {
                  igdbId: 101,
                  name: 'Cached View Game',
                },
              },
            ]);
          } else {
            resolve([]);
          }
        },
      };

      const result = await service.validateGameForAdd(101, 'user-1');

      expect(result).toEqual({
        igdbId: 101,
        existsOnIgdb: true,
        alreadyInDb: false,
        gameName: 'Cached View Game',
        canAdd: true,
      });

      expect(mockIgdbService.getGameById).not.toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'game.queried',
          actorId: 'user-1',
          payload: expect.objectContaining({
            igdbId: 101,
            gameName: 'Cached View Game',
            found: true,
            alreadyInDb: false,
            gameInfo: expect.objectContaining({
              igdbId: 101,
              name: 'Cached View Game',
            }),
          }),
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
        execute: jest.fn(),
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
        }),
      );
    });
  });
});
