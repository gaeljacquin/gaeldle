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
import { GamesService } from '~/src/games/games.service';
import { Others } from '~/types/other';
import cors from '~/utils/cors';
import { ModeMap } from '~/utils/mode-map';
import { bgCorrect, bgIncorrect, bgPartial } from '~/utils/constants';

@WebSocketGateway({ cors })
export class DailyGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly dailyStatsService: DailyStatsService,
    private readonly gotdService: GotdService,
    private readonly gamesService: GamesService,
  ) {}

  @WebSocketServer() server: Server;

  private classicMap = new ModeMap();
  private artworkMap = new ModeMap();
  private keywordsMap = new ModeMap();
  private specificationsMap = new ModeMap();

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

  @SubscribeMessage('specifications')
  async handleSpecifications(client: Socket, data): Promise<void> {
    void this.gameLogic(client, 4, this.specificationsMap, data);
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
    const name2 = data.game.name;
    const lives = gotd.modes.lives;
    const livesLeft = data.livesLeft;
    const answer = igdbId === igdbIdToday;
    const finished = answer || livesLeft === 0;
    const gameOver = !answer && livesLeft === 0;
    const game = await this.gamesService.dbFindOne(igdbId);
    let name = null;
    let nextKeyword = null;
    let imageUrl = '';

    if (finished) {
      name = gotd.games.name;
      imageUrl = gotd.games.imageUrl as string;
      modeMap.delete(clientId);
    }

    let emit = {
      clientId,
      answer,
      name,
      imageUrl,
      guess: {
        name: name2,
        igdbId,
      },
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
        const specs = await this.checkSpecs(game, igdbIdToday, answer);
        let specsFinal;

        if (gameOver) {
          specsFinal = await this.checkSpecs(gotd.games, igdbIdToday, true);
        }

        emit = { ...emit, ...{ specs }, ...{ specsFinal } };
        break;
    }

    client.emit(`daily-res-${modeId}`, emit);
  }

  private async checkSpecs(game, igdbIdToday, final = false) {
    const gotd = await this.gamesService.dbFindOne(igdbIdToday);
    const gameFirstReleaseYear = new Date(
      game.info.first_release_date * 1000,
    ).getFullYear();
    const gotdFirstReleaseYear = new Date(
      gotd.info['first_release_date'] * 1000,
    ).getFullYear();
    const specs = {
      imageUrl: game.imageUrl,
      platforms: {
        values: game.platforms?.map((item) => item.name),
        specscn: final
          ? bgCorrect
          : this.compare(game.platforms, gotd.platforms),
      },
      genres: {
        values: game.genres?.map((item) => item.name),
        specscn: final ? bgCorrect : this.compare(game.genres, gotd.genres),
      },
      themes: {
        values: game.themes?.map((item) => item.name),
        specscn: final ? bgCorrect : this.compare(game.themes, gotd.themes),
      },
      release_dates: {
        value: gameFirstReleaseYear, // return initial release year if multi-platform
        specscn:
          gameFirstReleaseYear === gotdFirstReleaseYear || final
            ? bgCorrect
            : bgIncorrect,
        arrowDir:
          gameFirstReleaseYear === gotdFirstReleaseYear
            ? ''
            : gameFirstReleaseYear > gotdFirstReleaseYear
              ? 'down'
              : 'up',
      },
      game_modes: {
        values: game.game_modes?.map((item) => item.name),
        specscn: final
          ? bgCorrect
          : this.compare(game.game_modes, gotd.game_modes),
      },
      game_engines: {
        values: game.game_engines?.map((item) => item.name),
        specscn: final
          ? bgCorrect
          : this.compare(game.game_engines, gotd.game_engines),
      },
      player_perspectives: {
        values: game.player_perspectives?.map((item) => item.name),
        specscn: final
          ? bgCorrect
          : this.compare(game.player_perspectives, gotd.player_perspectives),
      },
    };

    return specs;
  }

  private compare(game, gotd): string {
    function extractIds(mylist): number[] {
      if (!mylist) {
        return [];
      }

      return mylist
        .filter((obj) => obj.hasOwnProperty('id'))
        .map((obj) => obj.id);
    }

    function isSubset(game, gotd): boolean {
      return game.every((id) => gotd.includes(id));
    }

    function isPartialSubset(game, gotd): boolean {
      return game.some((id) => gotd.includes(id));
    }

    const gameIdList = extractIds(game);
    const gotdIdList = extractIds(gotd);

    if (gameIdList.length === 0 || gotdIdList.length === 0) {
      return bgIncorrect;
    }

    if (JSON.stringify(gameIdList) === JSON.stringify(gotdIdList)) {
      return bgCorrect;
    }

    if (isSubset(gameIdList, gotdIdList)) {
      return bgPartial;
    }

    if (isSubset(gotdIdList, gameIdList)) {
      return bgPartial;
    }

    if (isPartialSubset(gameIdList, gotdIdList)) {
      return bgPartial;
    }

    if (isPartialSubset(gotdIdList, gameIdList)) {
      return bgPartial;
    }

    return bgIncorrect;
  }

  // @SubscribeMessage('message')
  // handleMessage(client: Socket, data: unknown): void {
  //   console.info(`Received message from client: ${client.id}`);
  //   const response = `Hello, you sent -> ${data}`;
  //   client.emit('response', { clientId: client.id, response });
  // }
}
