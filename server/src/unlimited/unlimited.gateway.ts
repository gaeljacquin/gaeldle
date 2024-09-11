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
import { GamesService } from '../games/games.service';
import { Game, Games } from '~/types/games';
import cors from '~/utils/cors';

@WebSocketGateway({ cors })
export class UnlimitedGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly gamesService: GamesService,
    private readonly unlimitedStatsService: UnlimitedStatsService,
  ) {}

  @WebSocketServer() server: Server;

  private cuMap = new Map<string, Game>();
  private games: Games;
  private gamesLength: number;

  async afterInit() {
    console.log('WebSocket server initialized (unlimited)');
    this.games = await this.gamesService.findAll();
    this.gamesLength = this.games.length;
  }

  async handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected (unlimited): ${client.id}`);
    console.log('args: ', args);

    if (!this.cuMap.has(client.id)) {
      const cuIndex = Math.floor(Math.random() * this.gamesLength);
      const cuGame = this.games[cuIndex] as Game;
      this.cuMap.set(client.id, cuGame);

      client.emit('cu-image-url', {
        imageUrl: cuGame.imageUrl,
      });
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected (unlimited): ${client.id}`);
    this.cuMap.delete(client.id);
  }

  @SubscribeMessage('unlimited-stats')
  async handleUnlimitedStats(client: Socket, message): Promise<void> {
    const clientId = client.id;
    console.info('Received unlimited stats:', message);
    const data = message.data;
    await this.unlimitedStatsService.create(data);
    client.emit('unlimited-stats-response', {
      message: `Saved unlimited stats for ${clientId}`,
    });
  }

  @SubscribeMessage('classic-unlimited')
  async handleClassicUnlimited(client: Socket, data): Promise<void> {
    const clientId = client.id;
    const cuGame = this.cuMap.get(clientId);
    let name = '';
    let igdbId = 0;
    const check = data.game.igdbId;
    const livesLeft = data.livesLeft;
    const answer = check === cuGame.igdbId;

    if (answer || livesLeft === 0) {
      name = cuGame.name;
      igdbId = cuGame.igdbId;
      this.cuMap.delete(clientId);
    }

    client.emit('cu-response', {
      clientId,
      answer,
      game: {
        name,
        igdbId,
      },
    });
  }
}
