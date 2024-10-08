import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '~/src/prisma/prisma.service';
import { bgOther1, whichList } from '~/utils/constants';
// import { testGameIgdbIds } from '~/utils/constants';
import { genKey } from '~/utils/env-checks';
import { upstashRedisInit } from '~/utils/upstash-redis';

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

  private key = genKey('games');

  async findAll() {
    let games;

    try {
      const gamesCached = await fetch(
        `${process.env.UPSTASH_REDIS_REST_URL}/get/${this.key}`,
        {
          method: 'GET',
          ...upstashRedisInit,
        },
      );
      games = JSON.parse((await gamesCached.json()).result);

      if (!games) {
        games = await this.prisma.games.findMany({
          select: {
            igdbId: true,
            name: true,
            imageUrl: true,
          },
          orderBy: {
            name: 'asc',
          },
        });
        await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/${this.key}`, {
          method: 'POST',
          ...upstashRedisInit,
          body: JSON.stringify(games),
        });
      }
    } catch (error) {
      console.error('Failed to fetch games: ', error);
    }

    return games ?? null;
  }

  async findOne(igdbId: number) {
    const game = await this.prisma.games.findFirstOrThrow({
      omit: {
        id: true,
        createdAt: true,
        updatedAt: true,
      },
      where: {
        igdbId: igdbId,
      },
    });

    return game;
  }

  async findRandom(numCards: number) {
    const data = await this.prisma.$queryRaw`
      SELECT
        sub.*
      FROM (
        SELECT DISTINCT ON (g.first_release_date)
          g.igdb_id AS "igdbId", -- double quotes to retain case
          g.name,
          g.image_url AS "imageUrl",
          ${bgOther1} AS "bgStatus",
          ((g.first_release_date)::int) AS frd,
          to_char(to_timestamp((g.first_release_date)::bigint), 'YYYY-MM-DD') as "frdFormatted"
        FROM games g
        WHERE g.first_release_date IS NOT NULL
        ORDER BY g.first_release_date, RANDOM()
        LIMIT ${numCards}
      ) sub
      ORDER BY sub.frd
    `;

    return data;
  }

  async findOneRandom(idlist?: number[]) {
    const data = await this.prisma.$queryRaw`
      SELECT
        g.igdb_id AS "igdbId", -- double quotes to retain case
        g.name,
        g.image_url AS "imageUrl",
        ${bgOther1} AS "bgStatus",
        ((g.first_release_date)::int) AS frd,
        to_char(to_timestamp((g.first_release_date)::bigint), 'YYYY-MM-DD') as "frdFormatted"
      FROM games g
      WHERE g.first_release_date IS NOT NULL
      AND g.igdb_id NOT IN (${Prisma.join(whichList(idlist))})
      ORDER BY RANDOM()
      LIMIT 1
    `;

    return data;
  }
}
