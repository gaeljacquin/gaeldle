import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UnlimitedStatsService } from '~/src/unlimited-stats/unlimited-stats.service';
import { GamesService } from '~/src/games/games.service';
import cors from '~/utils/cors';
import { ModeMap } from '~/utils/mode-map';
import shuffleList from '~/utils/shuffle-list';
import { ModesService } from '~/src/modes/modes.service';
import { getRandomGames } from '~/utils/env-checks';
import { bgCorrect, bgIncorrect, bgOther1, bgOther2 } from '~/utils/constants';
import { Games } from '~/types/games';

@WebSocketGateway({ cors })
export class TriviaryGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly gamesService: GamesService,
    private readonly modesService: ModesService,
    private readonly unlimitedStatsService: UnlimitedStatsService,
  ) {}

  @WebSocketServer() server: Server;

  private triviaryMap = new ModeMap();
  private mode = this.modesService.findOne(8);

  async afterInit() {
    console.info('WebSocket server initialized (triviary)');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    console.info(`Client connected (triviary): ${client.id}`);
    console.info('args: ', args);

    this.handleTriviaryInit(client);
  }

  handleDisconnect(client: Socket) {
    console.info(`Client disconnected (triviary): ${client.id}`);
    this.triviaryMap.delete(client.id);
  }

  @SubscribeMessage('triviary-stats')
  async handleTriviaryStats(client: Socket, data): Promise<void> {
    const clientId = client.id;
    console.info('Received triviary stats:', data);
    await this.unlimitedStatsService.create(data);
    client.emit('triviary-stats-res', {
      message: `Saved triviary stats for ${clientId}`,
    });
  }

  @SubscribeMessage('triviary')
  async handleTriviary(client: Socket, data): Promise<void> {
    const clientId = client.id;
    const games = this.triviaryMap.get(clientId);
    const { timeline, livesLeft } = data;
    let answer = true;

    if (timeline.length !== (games as []).length) {
      return;
    }

    const updatedTimeline = timeline.map((game, index) => {
      if (game.igdbId === games[index].igdbId) {
        return {
          ...game,
          bgStatus: bgCorrect,
          frd: games[index].frd,
          frdFormatted: games[index].frdFormatted,
          correctIndex: index,
        };
      } else {
        if (answer) {
          answer = false;
        }

        return { ...game, bgStatus: bgIncorrect };
      }
    });

    // const finished = answer || livesLeft === 0;
    const gameOver = !answer && livesLeft === 0;

    let emit = {
      answer,
      timeline: updatedTimeline,
    };

    if (gameOver) {
      const goodTimeline = (games as Games).map((game) => {
        return {
          ...game,
          bgStatus: bgOther2,
        };
      });
      emit = {
        ...emit,
        ...{ goodTimeline },
      };
    }

    client.emit('triviary-res', emit);
  }

  @SubscribeMessage('triviary-init')
  async handleTriviaryInit(client) {
    const numCards = (await this.mode).pixelationStep;
    const sampleSize = (await this.mode).pixelation;
    const games = await getRandomGames(this.gamesService, numCards, sampleSize);
    let reshuffledGames = shuffleList(games);
    reshuffledGames = reshuffledGames.map((game) => {
      const { frd, frdFormatted, ...rest } = game;
      void frd, frdFormatted;

      return { ...rest, bgStatus: bgOther1 };
    });
    this.triviaryMap.set(client.id, games);

    client.emit('triviary-init-res', {
      games: reshuffledGames,
      mode: await this.mode,
    });
  }
}
