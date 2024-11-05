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
export class HiloGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly gamesService: GamesService,
    private readonly modesService: ModesService,
    private readonly unlimitedStatsService: UnlimitedStatsService,
  ) {}

  @WebSocketServer() server: Server;

  private hiloMap = new ModeMap();
  private mode = this.modesService.findOne(10);

  async afterInit() {
    console.info('WebSocket server initialized (hilo)');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    console.info(`Client connected (hilo): ${client.id}`);
    console.info('args: ', args);
    this.handleHiloInit(client);
  }

  handleDisconnect(client: Socket) {
    console.info(`Client disconnected (hilo): ${client.id}`);
    this.hiloMap.delete(client.id);
  }

  @SubscribeMessage('hilo-stats')
  async handleHiloStats(client: Socket, data): Promise<void> {
    const clientId = client.id;
    console.info('Received hilo stats:', data);
    await this.unlimitedStatsService.create(data);
    client.emit('hilo-stats-res', {
      message: `Saved hilo stats for ${clientId}`,
    });
  }

  @SubscribeMessage('hilo-check')
  async handleHiloCheck(client: Socket, data): Promise<void> {
    const { operator } = data;
    const clientId = client.id;
    const gameCheck = this.hiloMap.get(clientId);
    const emit = {
      gameCheck,
      operator,
    };
    client.emit('hilo-check-res', emit);
  }

  @SubscribeMessage('hilo-next')
  async handleHiloNext(client: Socket, data): Promise<void> {
    const { timelineIds } = data;
    const clientId = client.id;
    const game = (await this.gamesService.findOneRandom(timelineIds))[0];
    let nextGame = null;

    if (game) {
      const { frd, frdFormatted, ...rest } = game;
      void frd, frdFormatted;
      nextGame = { ...rest };
      this.hiloMap.set(clientId, game);
    }

    const emit = { nextGame };
    client.emit('hilo-next-res', emit);
  }

  @SubscribeMessage('hilo-init')
  async handleHiloInit(client) {
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
    this.hiloMap.set(client.id, games[games.length - 1]);
    client.emit('hilo-init-res', {
      games: reshuffledGames,
      mode: await this.mode,
    });
  }
}
