import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@/db/database.service';
import { GamesService } from '@/games/games.service';
import { AiService } from '@/lib/ai.service';
import { domainEvents, type Game } from '@workspace/api-contract';

@Injectable()
export class InfoGenService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly gamesService: GamesService,
    private readonly aiService: AiService,
  ) {}

  async generateInfo(
    igdbId: number,
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
      provider: 'cloudflare',
      model: model,
      createdAt: new Date().toISOString(),
    };

    const updatedGame = await this.gamesService.updateGame(game.id, {
      infoGen: newItem,
    });

    if (!updatedGame) {
      throw new NotFoundException('Failed to update game record');
    }

    // Insert the domain event for info generation
    await this.databaseService.db.insert(domainEvents).values({
      eventType: 'info_gen.generated',
      actorId,
      payload: {
        igdbId,
        gameId: game.id,
        clue: clueString,
        prompt: `System: ${systemPrompt}\nUser: ${userPrompt}`,
        model,
        provider: 'cloudflare',
      },
    });

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
