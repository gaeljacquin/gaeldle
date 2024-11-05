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
import { Game } from '@/types/games';
import { getRandomGame } from '@/functions/games';

@WebSocketGateway({ cors })
export class CoverGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor() {}

  @WebSocketServer() server: Server;

  private coverMap = new ModeMap();

  async afterInit() {
    console.info('WebSocket server initialized (cover)');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    console.info(`Client connected (cover): ${client.id}`);
    console.info('args: ', args);
    this.handleCoverInit(client);
  }

  handleDisconnect(client: Socket) {
    console.info(`Client disconnected (cover): ${client.id}`);
    this.coverMap.delete(client.id);
  }

  @SubscribeMessage('cover')
  async handleCoverCheck(client: Socket, data): Promise<void> {
    const { game: selectedGame, livesLeft } = data;
    const { igdbId: igdbId2, name: name2 } = selectedGame;
    const clientId = client.id;
    const game = this.coverMap.get(clientId) as Game;
    const answer = game.igdbId === igdbId2;
    const finished = answer || livesLeft === 0;

    const name = finished ? game.name : '';
    const igdbId = finished ? game.igdbId : 0;
    const emit = {
      answer,
      name,
      igdbId,
      guess: {
        name: name2,
        igdbId: igdbId2,
      },
    };
    client.emit('cover-res', emit);
  }

  @SubscribeMessage('cover-next')
  async handleCoverNext(client: Socket, data): Promise<void> {
    const { skipIgdbIds } = data;
    const clientId = client.id;
    const game = await getRandomGame(skipIgdbIds);
    let nextGame = null;

    if (game) {
      const { name, ...rest } = game;
      void name;
      nextGame = { ...rest };
      this.coverMap.set(clientId, game);
    }

    const emit = {
      nextGame,
    };
    client.emit('cover-next-res', emit);
  }

  @SubscribeMessage('cover-init')
  async handleCoverInit(client) {
    const game = await getRandomGame(null);
    const nextGame = (game) => {
      const { igdbId, name, ...rest } = game;
      void igdbId, name;

      return { ...rest };
    };
    this.coverMap.set(client.id, game);
    const emit = {
      nextGame: nextGame(game),
    };
    client.emit('cover-init-res', emit);
  }
}
