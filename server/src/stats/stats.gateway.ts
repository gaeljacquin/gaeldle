import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { DailyStatsService } from '~/src/daily-stats/daily-stats.service';
import { UnlimitedStatsService } from '~/src/unlimited-stats/unlimited-stats.service';
import { CreateDailyStatsDto } from '~/src/daily-stats/dto/create-daily-stats.dto';
import { CreateUnlimitedStatsDto } from '~/src/unlimited-stats/dto/create-unlimited-stats.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL,
    methods: 'GET,POST,PATCH,PUT',
    credentials: false,
  },
})
export class StatsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(StatsGateway.name);
  constructor(
    private readonly dailyStatsService: DailyStatsService,
    private readonly unlimitedStatsService: UnlimitedStatsService,
  ) {}

  @WebSocketServer() io: Server;

  afterInit() {
    this.logger.log('Daily stats gateway initialized');
  }

  handleConnection(client: Socket) {
    const { sockets } = this.io.sockets;

    this.logger.log(`Client id: ${client.id} connected`);
    this.logger.debug(`Number of connected clients: ${sockets.size}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client id:${client.id} disconnected`);
  }

  @SubscribeMessage('saveDailyStats')
  async handleDailyStats(client: Socket, data: CreateDailyStatsDto) {
    this.logger.log(`Message received from client id: ${client.id}`);
    this.logger.debug(`Payload: ${data}`);
    await this.dailyStatsService.create(data);
    client.emit('message', 'ok');
    return;
  }
  @SubscribeMessage('saveUnlimitedStats')
  async handleUnlimitedStats(client: Socket, data: CreateUnlimitedStatsDto) {
    this.logger.log(`Message received from client id: ${client.id}`);
    this.logger.debug(`Payload: ${data}`);
    await this.unlimitedStatsService.create(data);
    client.emit('message', 'ok');
    return;
  }
}
