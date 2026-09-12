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
      ).rejects.toThrow('Unsupported model/provider: invalid-provider');
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
    });

    it('should handle raw plain text responses gracefully', async () => {
      mockAiService.generateTextBedrock.mockResolvedValue(
        'A plain text clue string without json formatting.' as never,
      );

      await service.generateClue(1942, 'bedrock', 'user-1');

      expect(mockGamesService.updateGame).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          clue: expect.objectContaining({
            clue: 'A plain text clue string without json formatting.',
            provider: 'bedrock',
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
});
