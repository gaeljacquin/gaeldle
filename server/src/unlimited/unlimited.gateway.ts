import {} from // OnGatewayConnection,
// OnGatewayDisconnect,
// OnGatewayInit,
// SubscribeMessage,
// WebSocketGateway,
// WebSocketServer,
'@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
// import cors from '~/utils/cors';
import { GamesService } from '../games/games.service';
// import { Game } from '~/types/games';

// @WebSocketGateway({ cors })
// implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
export class UnlimitedGateway {
  constructor(private readonly gamesService: GamesService) {}

  // @WebSocketServer() server: Server;

  // private cuMap = new Map<string, Game>();
  // private randomGame;

  // afterInit() {
  //   console.log('WebSocket server initialized (unlimited)');
  //   this.randomGame = this.gamesService.findOneRandom();
  // }

  // async handleConnection(client: Socket, ...args: any[]) {
  //   console.log(`Client connected (unlimited): ${client.id}`);
  //   console.log('args: ', args);

  //   if (!this.cuMap.has(client.id)) {
  //     const randomGame = await this.randomGame;
  //     this.cuMap.set(client.id, randomGame);
  //     client.emit('cu-data', {
  //       imageUrl: randomGame.imageUrl,
  //     });
  //   }
  // }

  // handleDisconnect(client: Socket) {
  //   console.log(`Client disconnected (unlimited): ${client.id}`);
  //   this.cuMap.delete(client.id);
  // }

  // @SubscribeMessage('classic-unlimited')
  // async handleClassicUnlimited(client: Socket, data): Promise<void> {
  //   // console.log(client.id);
  //   // console.log(data);
  //   const clientId = client.id;
  //   const randomGame = this.cuMap.get(clientId);
  //   // console.log(randomGame);
  //   const check = data.game.igdbId;
  //   const livesLeft = data.livesLeft;
  //   // console.log(check);
  //   // console.log(livesLeft);
  //   const answer = check === randomGame.igdbId;
  //   let name = '';
  //   let igdbId = 0;

  //   if (answer || livesLeft === 0) {
  //     name = randomGame.name;
  //     igdbId = randomGame.igdbId;
  //     // this.cuMap.delete(clientId);
  //     this.randomGame = this.gamesService.findOneRandom();
  //     this.cuMap.set(clientId, this.randomGame);
  //   }

  //   client.emit('classic-unlimtied-response', {
  //     clientId,
  //     answer,
  //     name,
  //     igdbId,
  //   });
  // }
}
