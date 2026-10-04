import { Test, TestingModule } from '@nestjs/testing';
import {
  beforeEach,
  afterEach,
  describe,
  it,
  expect,
  jest,
} from '@jest/globals';
import { ClueService } from './clue.service';
import { DatabaseService } from '@/db/database.service';
import { GamesService } from '@/games/games.service';
import { AiService } from '@/lib/ai.service';
import { NotFoundException } from '@nestjs/common';
import { domainEvents } from '@workspace/db';

describe('ClueService', () => {
  let service: ClueService;
  let mockDatabaseService: { db: any };
  let mockGamesService: {
    getGameByIgdbId: jest.Mock<any>;
    updateGame: jest.Mock<any>;
    refreshAllGamesView: jest.Mock<any>;
  };
  let mockAiService: {
    generateText: jest.Mock<any>;
    generateTextBedrock: jest.Mock<any>;
  };
  let mockDb: any;

  const mockGame = {
    id: 1,
    igdbId: 1942,
    name: 'The Witcher 3: Wild Hunt',
    summary: 'A fantasy RPG game.',
    storyline: 'Geralt looks for Ciri.',
    firstReleaseDate: 1431993600,
    themes: ['Action', 'Fantasy'],
    keywords: ['monsters', 'magic'],
    gameModes: ['Single player'],
    genres: ['Role-playing (RPG)'],
  };

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined as never),
      }),
    };

    mockDatabaseService = {
      db: mockDb,
    };

    mockGamesService = {
      getGameByIgdbId: jest.fn().mockResolvedValue(mockGame as never),
      updateGame: jest.fn().mockResolvedValue(mockGame as never),
      refreshAllGamesView: jest.fn().mockResolvedValue(undefined as never),
    };

    mockAiService = {
      generateText: jest.fn(),
      generateTextBedrock: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClueService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: GamesService,
          useValue: mockGamesService,
        },
        {
          provide: AiService,
          useValue: mockAiService,
        },
      ],
    }).compile();

    service = module.get<ClueService>(ClueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateClue', () => {
    it('should throw for unsupported provider', async () => {
      await expect(
        service.generateClue(1942, 'invalid-provider'),
      ).rejects.toThrow('Unsupported clue provider: invalid-provider');
    });

    it('should return null when game not found', async () => {
      mockGamesService.getGameByIgdbId.mockResolvedValue(null as never);
      const result = await service.generateClue(999, 'cloudflare');
      expect(result).toBeNull();
    });

    it('should handle object responses from Cloudflare Workers AI', async () => {
      mockAiService.generateText.mockResolvedValue({
        clue: 'A mystery monster hunter clue from object format.',
      } as never);

      await service.generateClue(1942, 'cloudflare', 'user-1');

      expect(mockGamesService.updateGame).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          clue: expect.objectContaining({
            clue: 'A mystery monster hunter clue from object format.',
            provider: 'cloudflare',
            model: '@cf/meta/llama-3.1-8b-instruct',
          }),
        }),
      );

      expect(mockDb.insert).toHaveBeenCalledWith(domainEvents);
      expect(mockGamesService.refreshAllGamesView).toHaveBeenCalledWith(true);

      expect(mockAiService.generateText).toHaveBeenCalledWith(
        '@cf/meta/llama-3.1-8b-instruct',
        [
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('video-game guessing game'),
          }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('Game facts:'),
          }),
        ],
        expect.any(Object),
      );
    });

    it('should handle markdown JSON string responses from Bedrock', async () => {
      mockAiService.generateTextBedrock.mockResolvedValue(
        '```json\n{"clue": "A mystery clue wrapped in markdown json."}\n```' as never,
      );

      await service.generateClue(1942, 'nova-2-lite-v1', 'user-1');

      expect(mockGamesService.updateGame).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          clue: expect.objectContaining({
            clue: 'A mystery clue wrapped in markdown json.',
            provider: 'nova-2-lite-v1',
            model: 'us.amazon.nova-2-lite-v1:0',
          }),
        }),
      );

      expect(mockAiService.generateTextBedrock).toHaveBeenCalledWith(
        'us.amazon.nova-2-lite-v1:0',
        [
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('Game facts:'),
          }),
        ],
      );
    });

    it('should handle raw plain text responses gracefully', async () => {
      mockAiService.generateTextBedrock.mockResolvedValue(
        'A plain text clue string without json formatting.' as never,
      );

      await service.generateClue(1942, 'nova-2-lite-v1', 'user-1');

      expect(mockGamesService.updateGame).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          clue: expect.objectContaining({
            clue: 'A plain text clue string without json formatting.',
            provider: 'nova-2-lite-v1',
            model: 'us.amazon.nova-2-lite-v1:0',
          }),
        }),
      );
    });
  });

  describe('restoreClue', () => {
    it('should throw NotFoundException if history entry is missing', async () => {
      mockDb.limit.mockResolvedValue([] as never);

      await expect(service.restoreClue(1942, 123)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if history entry does not match igdbId', async () => {
      mockDb.limit.mockResolvedValue([
        { id: 123, igdbId: 9999, gameId: 1, clue: 'Test clue' },
      ] as never);

      await expect(service.restoreClue(1942, 123)).rejects.toThrow(
        'Clue history entry does not belong to this game',
      );
    });

    it('should successfully restore clue and insert domain event', async () => {
      mockDb.limit.mockResolvedValue([
        {
          id: 123,
          igdbId: 1942,
          gameId: 1,
          clue: 'Restored clue text',
          prompt: 'Restored prompt',
          provider: 'cloudflare',
          model: '@cf/meta/llama-3.1-8b-instruct',
        },
      ] as never);

      const result = await service.restoreClue(1942, 123, 'admin-user');

      expect(mockGamesService.updateGame).toHaveBeenCalledWith(1, {
        clue: expect.objectContaining({
          clue: 'Restored clue text',
          provider: 'cloudflare',
        }),
      });
      expect(mockDb.insert).toHaveBeenCalledWith(domainEvents);
      expect(mockGamesService.refreshAllGamesView).toHaveBeenCalledWith(true);
      expect(result).toEqual(mockGame);
    });
  });

  describe('archiveActiveClue', () => {
    it('should return null when game is missing', async () => {
      mockGamesService.getGameByIgdbId.mockResolvedValue(null as never);

      await expect(service.archiveActiveClue(1942)).resolves.toBeNull();
    });

    it('should reject archiving when there is no active clue', async () => {
      await expect(service.archiveActiveClue(1942)).rejects.toThrow(
        'Game has no active clue',
      );
    });

    it('should clear the active clue and record an archive event', async () => {
      const gameWithClue = {
        ...mockGame,
        clue: {
          clue: 'A clue to delete',
          prompt: 'A prompt to delete',
          provider: 'cloudflare',
          model: '@cf/meta/llama-3.1-8b-instruct',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      };
      mockGamesService.getGameByIgdbId.mockResolvedValue(gameWithClue as never);
      mockDb.orderBy.mockResolvedValue([
        {
          id: 456,
          igdbId: 1942,
          clue: 'A clue to delete',
          prompt: 'A prompt to delete',
          provider: 'cloudflare',
          model: '@cf/meta/llama-3.1-8b-instruct',
        },
      ] as never);

      await service.archiveActiveClue(1942, 'admin-user');

      expect(mockGamesService.updateGame).toHaveBeenCalledWith(1, {
        clue: null,
      });
      expect(mockDb.insert).toHaveBeenCalledWith(domainEvents);
      expect(mockDb.insert.mock.results[0].value.values).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'clue.archived',
          actorId: 'admin-user',
          payload: expect.objectContaining({
            igdbId: 1942,
            gameId: 1,
            clue: 'A clue to delete',
            archivedHistoryId: 456,
          }),
        }),
      );
      expect(mockGamesService.refreshAllGamesView).toHaveBeenCalledWith(true);
    });
  });

  describe('getClueHistory', () => {
    it('should omit the current clue and keep prior clues in history', async () => {
      const activeClue = {
        clue: 'Current clue',
        prompt: 'Current prompt',
        provider: 'cloudflare',
        model: '@cf/meta/llama-3.1-8b-instruct',
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      mockGamesService.getGameByIgdbId.mockResolvedValue({
        ...mockGame,
        clue: activeClue,
      } as never);
      mockDb.orderBy.mockResolvedValue([
        {
          id: 456,
          igdbId: 1942,
          ...activeClue,
        },
        {
          id: 123,
          igdbId: 1942,
          clue: 'Archived clue',
          prompt: 'Archived prompt',
          provider: 'cloudflare',
          model: '@cf/meta/llama-3.1-8b-instruct',
        },
      ] as never);

      await expect(service.getClueHistory(1942)).resolves.toEqual([
        expect.objectContaining({ id: 123, clue: 'Archived clue' }),
      ]);
    });
  });

  describe('deleteClueHistoryEntry', () => {
    it('should reject deletion of the active clue', async () => {
      const activeClue = {
        clue: 'Current clue',
        prompt: 'Current prompt',
        provider: 'cloudflare',
        model: '@cf/meta/llama-3.1-8b-instruct',
      };
      const historyEntry = { id: 123, igdbId: 1942, gameId: 1, ...activeClue };
      mockDb.limit.mockResolvedValue([historyEntry] as never);
      mockDb.orderBy.mockResolvedValue([historyEntry] as never);
      mockGamesService.getGameByIgdbId.mockResolvedValue({
        ...mockGame,
        clue: activeClue,
      } as never);

      await expect(service.deleteClueHistoryEntry(1942, 123)).rejects.toThrow(
        'Cannot delete the active clue',
      );
    });

    it('should record a history deletion event and return the deleted entry', async () => {
      const historyEntry = {
        id: 123,
        igdbId: 1942,
        gameId: 1,
        clue: 'A historical clue',
      };
      mockDb.limit.mockResolvedValue([historyEntry] as never);

      await expect(
        service.deleteClueHistoryEntry(1942, 123, 'admin-user'),
      ).resolves.toEqual(historyEntry);

      expect(mockDb.insert.mock.results[0].value.values).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'clue.history_deleted',
          actorId: 'admin-user',
          payload: expect.objectContaining({
            igdbId: 1942,
            gameId: 1,
            deletedHistoryId: 123,
          }),
        }),
      );
      expect(mockGamesService.refreshAllGamesView).toHaveBeenCalledWith(true);
    });

    it('should return null when the history entry is missing or belongs to another game', async () => {
      mockDb.limit.mockResolvedValue([] as never);
      await expect(
        service.deleteClueHistoryEntry(1942, 123),
      ).resolves.toBeNull();

      mockDb.limit.mockResolvedValue([
        { id: 123, igdbId: 9999, gameId: 1, clue: 'Another clue' },
      ] as never);
      await expect(
        service.deleteClueHistoryEntry(1942, 123),
      ).resolves.toBeNull();
    });
  });
});
