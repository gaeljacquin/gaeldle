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
import { bgCorrect } from '~/utils/constants';
import { Games } from '~/types/games';

@WebSocketGateway({ cors })
export class Timeline2Gateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly gamesService: GamesService,
    private readonly modesService: ModesService,
    private readonly unlimitedStatsService: UnlimitedStatsService,
  ) {}

  @WebSocketServer() server: Server;

  private timeline2Map = new ModeMap();
  private mode = this.modesService.findOne(9);

  async afterInit() {
    console.info('WebSocket server initialized (timeline2)');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    console.info(`Client connected (timeline2): ${client.id}`);
    console.info('args: ', args);
    this.handleTimeline2Init(client);
  }

  handleDisconnect(client: Socket) {
    console.info(`Client disconnected (timeline2): ${client.id}`);
    this.timeline2Map.delete(client.id);
  }

  @SubscribeMessage('timeline2-stats')
  async handleTimeline2Stats(client: Socket, data): Promise<void> {
    const clientId = client.id;
    console.info('Received timeline2 stats:', data);
    await this.unlimitedStatsService.create(data);
    client.emit('timeline2-stats-res', {
      message: `Saved timeline2 stats for ${clientId}`,
    });
  }

  @SubscribeMessage('timeline2-check')
  async handleTimeline2Check(client: Socket, data): Promise<void> {
    const { insertIndex } = data;
    const clientId = client.id;
    const gameCheck = this.timeline2Map.get(clientId);
    const emit = {
      gameCheck,
      insertIndex,
    };
    client.emit('timeline2-check-res', emit);
  }

  @SubscribeMessage('timeline2-next')
  async handleTimeline2Next(client: Socket, data): Promise<void> {
    const { timelineIds } = data;
    const clientId = client.id;
    const game = (await this.gamesService.findOneRandom(timelineIds))[0];
    let nextGame = null;

    if (game) {
      const { frd, frdFormatted, ...rest } = game;
      void frd, frdFormatted;
      nextGame = { ...rest };
      this.timeline2Map.set(clientId, game);
    }

    const emit = { nextGame };
    client.emit('timeline2-next-res', emit);
  }

  @SubscribeMessage('timeline2-init')
  async handleTimeline2Init(client) {
    const numCards = (await this.mode).pixelationStep;
    const sampleSize = (await this.mode).pixelation;
    const games = (await this.gamesService.findRandom(
      numCards,
      sampleSize,
    )) as Games;
    let reshuffledGames = shuffleList(games);
    reshuffledGames = games.map((game, index) => {
      if (index === games.length - 1) {
        const { frd, frdFormatted, ...rest } = game;
        void frd, frdFormatted;

        return { ...rest };
      } else {
        return { ...game, bgStatus: bgCorrect };
      }
    });
    this.timeline2Map.set(client.id, games[games.length - 1]);
    client.emit('timeline2-init-res', {
      games: reshuffledGames,
      mode: await this.mode,
    });
  }
}
