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
import shuffleList from '~/utils/shuffle-list';
import { ModesService } from '~/src/modes/modes.service';
import { bgCorrect, bgIncorrect, bgOther1, bgOther2 } from '~/utils/constants';
import { Game, Games } from '~/types/games';

@WebSocketGateway({ cors })
export class TimelineGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly gamesService: GamesService,
    private readonly modesService: ModesService,
    private readonly unlimitedStatsService: UnlimitedStatsService,
  ) {}

  @WebSocketServer() server: Server;

  private timelineMap = new ModeMap();
  private mode = this.modesService.findOne(8);

  async afterInit() {
    console.info('WebSocket server initialized (timeline)');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    console.info(`Client connected (timeline): ${client.id}`);
    console.info('args: ', args);
    this.handleTimelineInit(client);
  }

  handleDisconnect(client: Socket) {
    console.info(`Client disconnected (timeline): ${client.id}`);
    this.timelineMap.delete(client.id);
  }

  @SubscribeMessage('timeline-stats')
  async handleTimelineStats(client: Socket, data): Promise<void> {
    const clientId = client.id;
    console.info('Received timeline stats:', data);
    await this.unlimitedStatsService.create(data);
    client.emit('timeline-stats-res', {
      message: `Saved timeline stats for ${clientId}`,
    });
  }

  @SubscribeMessage('timeline')
  async handleTimeline(client: Socket, data): Promise<void> {
    const clientId = client.id;
    const games = this.timelineMap.get(clientId);
    const { timeline, livesLeft } = data;
    let answer = true;

    if (timeline.length !== (games as []).length) {
      return;
    }

    const updatedTimeline = timeline.map((card, index) => {
      if (card.igdbId === games[index].igdbId) {
        return {
          ...card,
          bgStatus: bgCorrect,
          frd: games[index].frd,
          frdFormatted: games[index].frdFormatted,
          correctIndex: index,
        };
      } else {
        if (answer) {
          answer = false;
        }

        const listLength = (games as []).length;
        const correctIndex = (games as []).findIndex(
          (game: Game) => game.igdbId === card.igdbId,
        );
        const positionDifference = Math.abs(index - correctIndex);
        const proximity =
          ((listLength - positionDifference) / listLength) * 100;

        return {
          ...card,
          bgStatus: bgIncorrect,
          latestIndex: index,
          proximity,
        };
      }
    });

    // const finished = answer || livesLeft === 0;
    const gameOver = !answer && livesLeft === 0;

    let emit = {
      answer,
      timeline: updatedTimeline,
    };

    if (gameOver) {
      const goodTimeline = (games as Games).map((game) => {
        return {
          ...game,
          bgStatus: bgOther2,
        };
      });
      emit = {
        ...emit,
        ...{ goodTimeline },
      };
    }

    client.emit('timeline-res', emit);
  }

  @SubscribeMessage('timeline-init')
  async handleTimelineInit(client) {
    const numCards = (await this.mode).pixelationStep;
    const sampleSize = (await this.mode).pixelation;
    const games = (await this.gamesService.findRandom(
      numCards,
      sampleSize,
    )) as Games;
    let reshuffledGames = shuffleList(games);
    reshuffledGames = reshuffledGames.map((game) => {
      const { frd, frdFormatted, ...rest } = game;
      void frd, frdFormatted;

      return { ...rest, bgStatus: bgOther1 };
    });
    this.timelineMap.set(client.id, games);

    client.emit('timeline-init-res', {
      games: reshuffledGames,
      mode: await this.mode,
    });
  }
}
