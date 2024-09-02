import { Injectable } from '@nestjs/common';
import { PrismaService } from '~/src/prisma/prisma.service';
import { ModesService } from '~/src/modes/modes.service';
import { upstashRedisInit } from '~/utils/upstash-redis';

@Injectable()
export class GamesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly modesService: ModesService,
  ) {}

  async findAll() {
    let key = 'games';

    if (
      process.env.NODE_ENV === 'dev' ||
      process.env.NODE_ENV === 'development'
    ) {
      key += '_dev';
    }

    let games = await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/get/${key}`,
      upstashRedisInit,
    );
    let games2 = await (await games.json()).result;

    if (!games2) {
      try {
        games2 = JSON.stringify(
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

        await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/${key}`, {
          method: 'POST',
          ...upstashRedisInit,
          body: games2,
        });
      } catch (error) {
        console.error('Failed to fetch games: ', error);
      }
    }

    games = JSON.parse(games2);

    return games ?? null;
  }

  async findOneRandom(modeId) {
    let key = 'games-alt';

    if (
      process.env.NODE_ENV === 'dev' ||
      process.env.NODE_ENV === 'development'
    ) {
      key += '_dev';
    }

    let games = await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/get/${key}`,
      upstashRedisInit,
    );
    let games2 = await (await games.json()).result;
    let game;

    if (!games2) {
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
        await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/${key}`, {
          method: 'POST',
          ...upstashRedisInit,
          body: games2,
        });
        game = games[0];
      } catch (error) {
        console.error('Failed to fetch games: ', error);
      }
    } else {
      const games3 = JSON.parse(games2);
      const randomIndex = Math.floor(Math.random() * games3.length);
      game = games3[randomIndex];
    }

    const mode = await this.modesService.findOne(modeId);
    game['mode'] = mode;

    return game ?? null;
  }
}
