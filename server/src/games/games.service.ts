import { Injectable } from '@nestjs/common';
import { PrismaService } from '~/src/prisma/prisma.service';
import { RedisService } from '~/src/redis/redis.service';
import { ModesService } from '~/src/modes/modes.service';

@Injectable()
export class GamesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly modesService: ModesService,
  ) {}

  async findAll() {
    const key = 'games';
    let games = await this.redisService.getData(key);

    if (!games) {
      try {
        const games2 = JSON.stringify(
          await this.prisma.games.findMany({
            select: {
              igdbId: true,
              name: true,
            },
            orderBy: {
              name: 'asc',
            },
          }),
        );
        games = JSON.parse(games2);
        await this.redisService.setData(key, games2);
      } catch (error) {
        console.error('Failed to fetch games: ', error);
      }
    }

    return games ?? null;
  }

  async findOneRandom(modeId) {
    const key = 'games-alt';
    let games = await this.redisService.getData(key);
    let games2;
    let game;

    if (!games) {
      try {
        games2 = JSON.stringify(
          await this.prisma.$queryRaw`
            SELECT igdb_id AS "igdbId", name, info, image_url AS "imageUrl"
            FROM
              games
            ORDER BY
              RANDOM()
            ;
          `,
        );
        games = JSON.parse(games2);
        await this.redisService.setData(key, games2);
        game = games[0];
      } catch (error) {
        console.error('Failed to fetch games: ', error);
      }
    } else {
      const randomIndex = Math.floor(Math.random() * games.length);
      game = games[randomIndex];
    }

    const mode = await this.modesService.findOne(modeId);
    game['mode'] = mode;
    // await this.redisService.setData('random-game', JSON.stringify(game));

    return game ?? null;
  }
}
