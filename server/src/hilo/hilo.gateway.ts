import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import cors from '@/utils/cors';
import { ModeMap } from '@/utils/mode-map';
import { bgCorrect } from '@/utils/constants';
import { Game, Games } from '@/types/games';
import { getMode } from '@/functions/modes';
import { getRandomGame, getRandomGames } from '@/functions/games';
import shuffleList from '@/utils/shuffle-list';

@WebSocketGateway({ cors })
export class HiloGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor() {}

  @WebSocketServer() server: Server;

  private hiloMap = new ModeMap();
  private mode = getMode(10);

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
    const game = (await getRandomGame(timelineIds)) as Game;
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
    const modeId = (await this.mode).id;
    const games = (await getRandomGames(modeId)) as Games;
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
    });
  }
}
