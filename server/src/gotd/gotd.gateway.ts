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
import cors from '~/utils/cors';

@WebSocketGateway({ cors })
export class GotdGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly gotdService: GotdService) {}

  @WebSocketServer() server: Server;

  private gotdClassic;

  afterInit() {
    console.log('WebSocket server initialized');
    this.gotdClassic = this.gotdService.findIt(1);
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
    const clientId = client.id;
    const gotd = await this.gotdClassic;
    const igdbId = gotd.igdbId;
    const check = data.game.igdbId;
    const livesLeft = data.livesLeft;
    const answer = check === igdbId;
    let name = '';

    if (answer || livesLeft === 0) {
      name = gotd.games.name;
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
