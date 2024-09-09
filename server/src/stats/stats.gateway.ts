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
import { UnlimitedStatsService } from '~/src/unlimited-stats/unlimited-stats.service';
import cors from '~/utils/cors';

@WebSocketGateway({ cors })
export class StatsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly dailyStatsService: DailyStatsService,
    private readonly unlimitedStatsService: UnlimitedStatsService,
  ) {}

  @WebSocketServer() server: Server;

  afterInit() {
    console.log('WebSocket server initialized (stats)');
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected (stats): ${client.id}`);
    console.log('args: ', args);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected (stats): ${client.id}`);
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

  // @SubscribeMessage('unlimited-stats')
  // async handleUnlimitedStats(client: Socket, message): Promise<void> {
  //   const clientId = client.id;
  //   console.info('Received unlimited stats:', message);
  //   const data = message.data;
  //   await this.unlimitedStatsService.create(data);
  //   client.emit('unlimited-stats-response', {
  //     message: `Saved unlimited stats for ${clientId}`,
  //   });
  // }
}
