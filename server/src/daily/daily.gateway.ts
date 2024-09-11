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

  private classicMap = new Map<string, Game>();
  private artworkMap = new Map<string, Game>();

  afterInit() {
    console.info('WebSocket server initialized (daily)');
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.info(`Client connected: ${client.id}`);
    console.info('args: ', args);
  }

  handleDisconnect(client: Socket) {
    console.info(`Client disconnected: ${client.id}`);
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
    void this.gameLogic(client, 1, this.classicMap, data);
  }

  @SubscribeMessage('artwork')
  async handleArtwork(client: Socket, data): Promise<void> {
    void this.gameLogic(client, 2, this.artworkMap, data);
  }

  private async gameLogic(
    client: Socket,
    modeId: number,
    modeMap: Map<string, Game>,
    data,
  ) {
    const clientId = client.id;

    if (!modeMap.has(clientId)) {
      const gotd = await this.gotdService.findIt(modeId);
      modeMap.set(client.id, gotd);
    }

    const gotd = modeMap.get(clientId);
    const igdbId = gotd.igdbId;
    const check = data.game.igdbId;
    const livesLeft = data.livesLeft;
    const answer = check === igdbId;
    let name = null;

    if (answer || livesLeft === 0) {
      name = gotd.games.name;
      modeMap.delete(clientId);
    }

    client.emit(`daily-res-${modeId}`, {
      clientId,
      answer,
      name,
    });
  }

  // @SubscribeMessage('message')
  // handleMessage(client: Socket, data: unknown): void {
  //   console.info(`Received message from client: ${client.id}`);
  //   const response = `Hello, you sent -> ${data}`;
  //   client.emit('response', { clientId: client.id, response });
  // }
}
