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
import { GamesService } from '~/src/games/games.service';
import cors from '~/utils/cors';
import { ModeMap } from '~/utils/mode-map';
import { ModesService } from '~/src/modes/modes.service';
import { getRandomGame } from '~/utils/env-checks';
import { Game } from '~/types/games';

@WebSocketGateway({ cors })
export class CoverGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly gamesService: GamesService,
    private readonly modesService: ModesService,
    private readonly unlimitedStatsService: UnlimitedStatsService,
  ) {}

  @WebSocketServer() server: Server;

  private coverMap = new ModeMap();
  private mode = this.modesService.findOne(5);

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

  @SubscribeMessage('cover-stats')
  async handleCoverStats(client: Socket, data): Promise<void> {
    const clientId = client.id;
    console.info('Received cover stats:', data);
    await this.unlimitedStatsService.create(data);
    client.emit('cover-stats-res', {
      message: `Saved cover stats for ${clientId}`,
    });
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
    const game = (await getRandomGame(this.gamesService, skipIgdbIds))[0];
    let nextGame = null;

    if (game) {
      const { name, ...rest } = game;
      void name;
      nextGame = { ...rest };
      this.coverMap.set(clientId, game);
    }

    const emit = {
      nextGame,
      mode: await this.mode,
    };
    client.emit('cover-next-res', emit);
  }

  @SubscribeMessage('cover-init')
  async handleCoverInit(client) {
    const game = (await getRandomGame(this.gamesService, null))[0];
    const nextGame = (game) => {
      const { igdbId, name, ...rest } = game;
      void igdbId, name;

      return { ...rest };
    };
    this.coverMap.set(client.id, game);
    const emit = {
      nextGame: nextGame(game),
      mode: await this.mode,
    };
    client.emit('cover-init-res', emit);
  }
}
