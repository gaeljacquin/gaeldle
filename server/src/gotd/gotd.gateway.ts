import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GotdService } from '~/src/gotd/gotd.service';
import { Game } from '~/types/games';
import cors from '~/utils/cors';

@WebSocketGateway({ cors })
export class GotdGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly gotdService: GotdService) {}

  @WebSocketServer() server: Server;

  private cMap = new Map<string, Game>();

  afterInit() {
    console.log('WebSocket server initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
    console.log('args: ', args);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('classic')
  async handleClassic(client: Socket, data): Promise<void> {
    if (!this.cMap.has(client.id)) {
      const gotdClassic = (await this.gotdService.findIt(1)) as Game;
      this.cMap.set(client.id, gotdClassic);
    }

    const clientId = client.id;
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
