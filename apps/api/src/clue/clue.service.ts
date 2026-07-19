import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@/db/database.service';
import { GamesService } from '@/games/games.service';
import { AiService } from '@/lib/ai.service';
import {
  domainEvents,
  gamesClueHistory,
  type Game,
  type GameClueHistory,
} from '@workspace/api-contract';
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
        return this.generateClueCloudflare(igdbId, provider, actorId);
      default:
        throw new Error(`Unsupported model/provider: ${provider}`);
    }
  }

  private async generateClueCloudflare(
    igdbId: number,
    provider: string,
    actorId = 'unknown',
  ): Promise<Game | null> {
    const game = await this.gamesService.getGameByIgdbId(igdbId);

    if (!game) {
      return null;
    }

    const systemPrompt = `
      You are an expert quiz master.

      Your task is to generate exactly 1 clue for the game provided in the user request.

      Rules:
      1. Do NOT mention the name of the game in the clue.
      2. Rely only on the fields provided in the game JSON (name, summary, storyline, first_release_date, themes, keywords, game_modes, genres) to derive the clue. Do not make up facts outside the provided context, but rephrase them creatively.
      3. The resulting clue should NOT simply list or contain every provided input field. Choose the most interesting aspects to create a cohesive, single clue.
      4. You must respond with a JSON object in this format:
      {
        "clue": "Your clue here"
      }
    `;

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
    const model = '@cf/meta/llama-3.1-8b-instruct';

    const responseText = await this.aiService.generateText(
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

    let clueString: string;

    if (typeof responseText === 'string') {
      const cleaned = responseText
        .trim()
        .replace(/^```(?:json)?\n?/, '')
        .replace(/\n?```$/, '')
        .trim();

      try {
        clueString = this.extractClue(JSON.parse(cleaned)) ?? responseText;
      } catch (e) {
        console.warn('Failed to parse AI response as JSON:', e);
        clueString = responseText;
      }
    } else if (responseText && typeof responseText === 'object') {
      clueString =
        this.extractClue(responseText) ?? JSON.stringify(responseText);
    } else {
      clueString = String(responseText ?? '');
    }

    const newItem = {
      clue: clueString,
      prompt: `System: ${systemPrompt}\nUser: ${userPrompt}`,
      provider,
      model: model,
      createdAt: new Date().toISOString(),
    };

    const updatedGame = await this.gamesService.updateGame(game.id, {
      clue: newItem,
    });

    if (!updatedGame) {
      throw new NotFoundException('Failed to update game record');
    }

    // Insert the domain event for info generation
    await this.databaseService.db.insert(domainEvents).values({
      eventType: 'clue.generated',
      actorId,
      payload: {
        igdbId,
        gameId: game.id,
        clue: clueString,
        prompt: `System: ${systemPrompt}\nUser: ${userPrompt}`,
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
