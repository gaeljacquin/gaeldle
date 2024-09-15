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
import { Others } from '~/types/other';
import cors from '~/utils/cors';
import { ModeMap } from '~/utils/mode-map';

@WebSocketGateway({ cors })
export class DailyGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly dailyStatsService: DailyStatsService,
    private readonly gotdService: GotdService,
  ) {}

  @WebSocketServer() server: Server;

  private classicMap = new ModeMap();
  private artworkMap = new ModeMap();
  private keywordsMap = new ModeMap();

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

  @SubscribeMessage('keywords')
  async handleKeywords(client: Socket, data): Promise<void> {
    void this.gameLogic(client, 3, this.keywordsMap, data);
  }

  private async gameLogic(
    client: Socket,
    modeId: number,
    modeMap: ModeMap,
    data,
  ) {
    const clientId = client.id;

    if (!modeMap.has(clientId)) {
      const gotd = await this.gotdService.findIt(modeId);
      modeMap.set(client.id, gotd);
    }

    const gotd = modeMap.get(clientId);
    const igdbIdToday = gotd.igdbId;
    const keywords = gotd.games.keywords as Others;
    const igdbId = data.game.igdbId;
    const lives = gotd.modes.lives;
    const livesLeft = data.livesLeft;
    const answer = igdbId === igdbIdToday;
    let name = null;
    let nextKeyword = null;
    let imageUrl = '';

    if (answer || livesLeft === 0) {
      name = gotd.games.name;
      imageUrl = gotd.games.imageUrl as string;
      modeMap.delete(clientId);
    }

    let emit = {
      clientId,
      answer,
      name,
      imageUrl,
    };

    switch (modeId) {
      case 1:
        break;
      case 2:
        break;
      case 3:
        if (!answer) {
          if (livesLeft === 1) {
            const t1 = keywords.slice(lives - livesLeft);
            const t2 = t1.map((item) => item.name);
            nextKeyword = t2.join(',');
          } else {
            nextKeyword = keywords[lives - livesLeft].name;
          }
        }

        emit = { ...emit, ...{ keyword: nextKeyword } };
        break;
      case 4:
        break;
    }

    client.emit(`daily-res-${modeId}`, emit);
  }

  // @SubscribeMessage('message')
  // handleMessage(client: Socket, data: unknown): void {
  //   console.info(`Received message from client: ${client.id}`);
  //   const response = `Hello, you sent -> ${data}`;
  //   client.emit('response', { clientId: client.id, response });
  // }
}
