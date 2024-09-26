import { Injectable } from '@nestjs/common';
import { PrismaService } from '~/src/prisma/prisma.service';
import { bgCorrect, testGameIgdbIds } from '~/utils/constants';
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
        games = await this.dbFindAll();
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

  async dbFindAll() {
    const games = await this.prisma.games.findMany({
      select: {
        igdbId: true,
        name: true,
        imageUrl: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return games;
  }

  async dbFindOne(igdbId: number) {
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

  async dbFindRandom(numCards: number, sampleSize: number) {
    const data = await this.prisma.$queryRaw`
      SELECT
        sub.*
      FROM (
        SELECT DISTINCT ON (g.first_release_date)
          g.igdb_id AS "igdbId", -- double quotes to retain case
          g.name,
          g.image_url AS "imageUrl",
          ${bgCorrect} AS "bgStatus",
          ((g.first_release_date)::int) AS frd,
          to_char(to_timestamp((g.first_release_date)::bigint), 'YYYY-MM-DD') as "frdFormatted"
        FROM games g
        TABLESAMPLE BERNOULLI (${sampleSize})
        WHERE first_release_date IS NOT NULL
        LIMIT ${numCards}
      ) sub
      ORDER BY sub.frd
    `;

    return data;
  }

  async dbFindRandomDev() {
    const data = await this.prisma.$queryRaw`
      SELECT
        sub.*
      FROM (
        SELECT
          g.igdb_id AS "igdbId",
          g.name,
          g.image_url AS "imageUrl",
          ${bgCorrect} AS "bgStatus",
          ((g.first_release_date)::int) AS frd,
          to_char(to_timestamp((g.first_release_date)::bigint), 'YYYY-MM-DD') as "frdFormatted"
        FROM games g
        WHERE igdb_id = ANY(${testGameIgdbIds})
        AND first_release_date IS NOT NULL
      ) sub
      ORDER BY sub.frd
    `;

    return data;
  }
}
