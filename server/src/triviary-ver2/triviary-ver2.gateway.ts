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
export class TriviaryVer2Gateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly gamesService: GamesService,
    private readonly modesService: ModesService,
    private readonly unlimitedStatsService: UnlimitedStatsService,
  ) {}

  @WebSocketServer() server: Server;

  private triviaryVer2Map = new ModeMap();
  private mode = this.modesService.findOne(9);

  async afterInit() {
    console.info('WebSocket server initialized (triviary-ver2)');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    console.info(`Client connected (triviary-ver2): ${client.id}`);
    console.info('args: ', args);

    this.handleTriviaryVer2Init(client);
  }

  handleDisconnect(client: Socket) {
    console.info(`Client disconnected (triviary-ver2): ${client.id}`);
    this.triviaryVer2Map.delete(client.id);
  }

  @SubscribeMessage('triviary-ver2-stats')
  async handleTriviaryVer2Stats(client: Socket, data): Promise<void> {
    const clientId = client.id;
    console.info('Received triviary-ver2 stats:', data);
    await this.unlimitedStatsService.create(data);
    client.emit('triviary-ver2-stats-res', {
      message: `Saved triviary-ver2 stats for ${clientId}`,
    });
  }

  @SubscribeMessage('triviary-ver2')
  async handleTriviaryVer2(client: Socket, data): Promise<void> {
    const clientId = client.id;
    const games = this.triviaryVer2Map.get(clientId);
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

    client.emit('triviary-ver2-res', emit);
  }

  @SubscribeMessage('init-triviary-ver2')
  async handleTriviaryVer2Init(client) {
    const numCards = (await this.mode).pixelationStep;
    const sampleSize = (await this.mode).pixelation;
    const games = await getRandomGames(this.gamesService, numCards, sampleSize);
    let reshuffledGames = shuffleList(games);
    reshuffledGames = reshuffledGames.map((game, index) => {
      if (index === games.length - 1) {
        const { frd, frdFormatted, ...rest } = game;
        void frd, frdFormatted;

        return { ...rest, bgStatus: bgOther1 };
      }

      return game;
    });
    this.triviaryVer2Map.set(client.id, games);

    client.emit('triviary-ver2-init', {
      games: reshuffledGames,
      mode: await this.mode,
    });
  }
}
