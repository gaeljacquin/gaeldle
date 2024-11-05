import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import cors from '@/utils/cors';
import { ModeMap } from '@/utils/mode-map';
import shuffleList from '@/utils/shuffle-list';
import { bgCorrect, bgIncorrect, bgOther1, bgOther2 } from '@/utils/constants';
import { getMode } from '@/functions/modes';
import { getRandomGames } from '@/functions/games';
import { Game, Games } from '@/types/games';

@WebSocketGateway({ cors })
export class TimelineGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor() {}

  @WebSocketServer() server: Server;

  private timelineMap = new ModeMap();
  private mode = getMode(8);

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
    const modeId = (await this.mode).id;
    const games = (await getRandomGames(modeId)) as Games;
    let reshuffledGames = shuffleList(games);
    reshuffledGames = reshuffledGames.map((game: Game) => {
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
