import { Injectable } from '@nestjs/common';
import { PrismaService } from '~/src/prisma/prisma.service';
import { ModesService } from '~/src/modes/modes.service';
import { upstashRedisInit } from '~/utils/upstash-redis';
import keyNameByEnv from '~/utils/key-name-env';

@Injectable()
export class GamesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly modesService: ModesService,
  ) {}

  async findAll() {
    const key = keyNameByEnv('games');
    let games;

    try {
      games = await this.prisma.games.findMany({
        select: {
          igdbId: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/${key}`, {
        method: 'POST',
        ...upstashRedisInit,
        body: JSON.stringify(games),
      });
    } catch (error) {
      console.error('Failed to fetch games: ', error);
    }

    return games ?? null;
  }

  async findOneRandom(modeId) {
    const key = keyNameByEnv('games2');
    let games;
    let game;

    try {
      games = await this.prisma.$queryRaw`
            SELECT igdb_id AS "igdbId", name, info, image_url AS "imageUrl"
            FROM
              games
            ORDER BY
              RANDOM()
            ;
          `;

      await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/${key}`, {
        method: 'POST',
        ...upstashRedisInit,
        body: JSON.stringify(games),
      });

      const mode = await this.modesService.findOne(modeId);
      game = games[0];
      game['mode'] = mode;
    } catch (error) {
      console.error('Failed to fetch games: ', error);
    }

    return game ?? null;
  }
}
