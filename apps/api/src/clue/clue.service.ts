import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@/db/database.service';
import { GamesService } from '@/games/games.service';
import { AiService } from '@/lib/ai.service';
import {
  domainEvents,
  gamesClueHistory,
  type Game,
  type GameClueHistory,
} from '@workspace/db';
import { CLUE_SYSTEM_PROMPT as systemPrompt } from '@workspace/shared';
import { eq, desc } from 'drizzle-orm';

@Injectable()
export class ClueService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly gamesService: GamesService,
    private readonly aiService: AiService,
  ) {}

  async generateClue(
    igdbId: number,
    provider: string,
    actorId = 'unknown',
  ): Promise<Game | null> {
    switch (provider) {
      case 'cloudflare':
      case 'bedrock':
      case 'nova-2-lite-v1':
        return this.generateClueInternal(igdbId, provider, actorId);
      default:
        throw new Error(`Unsupported model/provider: ${provider}`);
    }
  }

  private async generateClueInternal(
    igdbId: number,
    provider: string,
    actorId: string,
  ): Promise<Game | null> {
    const game = await this.gamesService.getGameByIgdbId(igdbId);

    if (!game) {
      return null;
    }

    const gameData = {
      name: game.name,
      summary: game.summary,
      storyline: game.storyline,
      first_release_date: game.firstReleaseDate,
      themes: game.themes,
      keywords: game.keywords,
      game_modes: game.gameModes,
      genres: game.genres,
    };

    const userPrompt = JSON.stringify(gameData, null, 2);
    let rawResponse: unknown;
    let model: string;

    if (provider === 'cloudflare') {
      model = '@cf/meta/llama-3.1-8b-instruct';
      rawResponse = await this.aiService.generateText(
        model,
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          type: 'json_schema',
          json_schema: {
            type: 'object',
            properties: {
              clue: {
                type: 'string',
              },
            },
            required: ['clue'],
          },
        },
      );
    } else {
      model = 'us.amazon.nova-2-lite-v1:0';
      rawResponse = await this.aiService.generateTextBedrock(model, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);
    }

    let clueString: string;

    if (typeof rawResponse === 'object' && rawResponse !== null) {
      clueString = this.extractClue(rawResponse) ?? JSON.stringify(rawResponse);
    } else if (typeof rawResponse === 'string') {
      const cleaned = rawResponse
        .trim()
        .replace(/^```(?:json)?\n?/, '')
        .replace(/\n?```$/, '')
        .trim();

      try {
        clueString = this.extractClue(JSON.parse(cleaned)) ?? cleaned;
      } catch {
        clueString = cleaned;
      }
    } else if (
      typeof rawResponse === 'number' ||
      typeof rawResponse === 'boolean'
    ) {
      clueString = String(rawResponse);
    } else {
      clueString = '';
    }

    const newItem = {
      clue: clueString,
      prompt: `System: ${systemPrompt}\nUser: ${userPrompt}`,
      provider,
      model,
      createdAt: new Date().toISOString(),
    };

    const updatedGame = await this.gamesService.updateGame(game.id, {
      clue: newItem,
    });

    if (!updatedGame) {
      throw new NotFoundException('Failed to update game record');
    }

    await this.databaseService.db.insert(domainEvents).values({
      eventType: 'clue.generated',
      actorId,
      payload: {
        igdbId,
        gameId: game.id,
        clue: clueString,
        prompt: newItem.prompt,
        model,
        provider,
      },
    });

    // Refresh views immediately to include this event
    await this.gamesService.refreshAllGamesView(true);

    return updatedGame;
  }

  async getClueHistory(igdbId: number): Promise<GameClueHistory[]> {
    return this.databaseService.db
      .select()
      .from(gamesClueHistory)
      .where(eq(gamesClueHistory.igdbId, igdbId))
      .orderBy(desc(gamesClueHistory.occurredAt));
  }

  async restoreClue(
    igdbId: number,
    historyId: number,
    actorId = 'unknown',
  ): Promise<Game | null> {
    const [historyEntry] = await this.databaseService.db
      .select()
      .from(gamesClueHistory)
      .where(eq(gamesClueHistory.id, historyId))
      .limit(1);

    if (!historyEntry) {
      throw new NotFoundException('Clue history entry not found');
    }

    if (historyEntry.igdbId !== igdbId) {
      throw new NotFoundException(
        'Clue history entry does not belong to this game',
      );
    }

    if (!historyEntry.gameId) {
      throw new NotFoundException(
        'Clue history entry is missing a game reference',
      );
    }

    const restoredClue = {
      clue: historyEntry.clue ?? '',
      prompt: historyEntry.prompt ?? '',
      provider: historyEntry.provider ?? '',
      model: historyEntry.model ?? '',
      createdAt: new Date().toISOString(),
    };

    const updatedGame = await this.gamesService.updateGame(
      historyEntry.gameId,
      {
        clue: restoredClue,
      },
    );

    if (!updatedGame) {
      throw new NotFoundException('Failed to update game record');
    }

    // Insert domain event for clue restoration
    await this.databaseService.db.insert(domainEvents).values({
      eventType: 'clue.restored',
      actorId,
      payload: {
        igdbId,
        gameId: historyEntry.gameId,
        clue: restoredClue.clue,
        prompt: restoredClue.prompt,
        model: restoredClue.model,
        provider: restoredClue.provider,
        restoredFromId: historyId,
      },
    });

    // Refresh views immediately to include this event
    await this.gamesService.refreshAllGamesView(true);

    return updatedGame;
  }

  private extractClue(value: unknown): string | null {
    if (typeof value === 'string') {
      return value;
    }

    if (value && typeof value === 'object' && 'clue' in value) {
      return this.extractClue((value as any).clue);
    }

    return null;
  }
}
