import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DailyStatsService } from '~/src/daily-stats/daily-stats.service';
import { GotdService } from '~/src/gotd/gotd.service';
import { Game } from '~/types/games';
import cors from '~/utils/cors';

@WebSocketGateway({ cors })
export class DailyGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly dailyStatsService: DailyStatsService,
    private readonly gotdService: GotdService,
  ) {}

  @WebSocketServer() server: Server;

  private cMap = new Map<string, Game>();

  afterInit() {
    console.log('WebSocket server initialized (daily)');
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
    console.log('args: ', args);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('daily-stats')
  async handleDailyStats(client: Socket, data): Promise<void> {
    const clientId = client.id;
    console.info('Received daily stats:', data);
    await this.dailyStatsService.create(data);
    client.emit('daily-stats-response', {
      message: `Saved daily stats for ${clientId}`,
    });
  }

  @SubscribeMessage('classic')
  async handleClassic(client: Socket, data): Promise<void> {
    const clientId = client.id;

    if (!this.cMap.has(clientId)) {
      const gotdClassic = (await this.gotdService.findIt(1)) as Game;
      this.cMap.set(client.id, gotdClassic);
    }

    const gotd = this.cMap.get(clientId);
    const igdbId = gotd.igdbId;
    const check = data.game.igdbId;
    const livesLeft = data.livesLeft;
    const answer = check === igdbId;
    let name = '';

    if (answer || livesLeft === 0) {
      name = gotd.name;
      this.cMap.delete(clientId);
    }

    client.emit('classic-response', {
      clientId,
      answer,
      name,
    });
  }

  // @SubscribeMessage('message')
  // handleMessage(client: Socket, data: unknown): void {
  //   console.log(`Received message from client: ${client.id}`);
  //   const response = `Hello, you sent -> ${data}`;
  //   client.emit('response', { clientId: client.id, response });
  // }
}
