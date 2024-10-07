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
import { getRandomGame, getRandomGames } from '~/utils/env-checks';
import { bgCorrect } from '~/utils/constants';

@WebSocketGateway({ cors })
export class Triviary2Gateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly gamesService: GamesService,
    private readonly modesService: ModesService,
    private readonly unlimitedStatsService: UnlimitedStatsService,
  ) {}

  @WebSocketServer() server: Server;

  private triviary2Map = new ModeMap();
  private mode = this.modesService.findOne(9);

  async afterInit() {
    console.info('WebSocket server initialized (triviary2)');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    console.info(`Client connected (triviary2): ${client.id}`);
    console.info('args: ', args);
    this.handleTriviary2Init(client);
  }

  handleDisconnect(client: Socket) {
    console.info(`Client disconnected (triviary2): ${client.id}`);
    this.triviary2Map.delete(client.id);
  }

  @SubscribeMessage('triviary2-stats')
  async handleTriviary2Stats(client: Socket, data): Promise<void> {
    const clientId = client.id;
    console.info('Received triviary2 stats:', data);
    await this.unlimitedStatsService.create(data);
    client.emit('triviary2-stats-res', {
      message: `Saved triviary2 stats for ${clientId}`,
    });
  }

  @SubscribeMessage('triviary2-check')
  async handleTriviary2Check(client: Socket, data): Promise<void> {
    const { insertIndex } = data;
    const clientId = client.id;
    const gameCheck = this.triviary2Map.get(clientId);
    const emit = {
      gameCheck,
      insertIndex,
    };
    client.emit('triviary2-check-res', emit);
  }

  @SubscribeMessage('triviary2-next')
  async handleTriviary2Next(client: Socket, data): Promise<void> {
    const { timelineIds } = data;
    const clientId = client.id;
    const game = (await getRandomGame(this.gamesService, timelineIds))[0];
    let nextGame = null;

    if (game) {
      const { frd, frdFormatted, ...rest } = game;
      void frd, frdFormatted;
      nextGame = { ...rest };
      this.triviary2Map.set(clientId, game);
    }

    const emit = { nextGame };
    client.emit('triviary2-next-res', emit);
  }

  @SubscribeMessage('triviary2-init')
  async handleTriviary2Init(client) {
    const numCards = (await this.mode).pixelationStep;
    const sampleSize = (await this.mode).pixelation;
    const games = await getRandomGames(this.gamesService, numCards, sampleSize);
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
    this.triviary2Map.set(client.id, games[games.length - 1]);
    client.emit('triviary2-init-res', {
      games: reshuffledGames,
      mode: await this.mode,
    });
  }
}
