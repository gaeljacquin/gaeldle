import { Injectable } from '@nestjs/common';
import { PrismaService } from '~/src/prisma/prisma.service';
import { bgOther1, testGameIgdbIds, whichList } from '~/utils/constants';
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

  async findRandom(numCards: number, sampleSize: number, idlist?: number[]) {
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
        TABLESAMPLE BERNOULLI (${sampleSize})
        WHERE g.first_release_date IS NOT NULL
        AND g.igdb_id != ANY(${whichList(idlist)})
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
      TABLESAMPLE BERNOULLI (5)
      WHERE g.first_release_date IS NOT NULL
      AND g.igdb_id != ANY(${whichList(idlist)})
      LIMIT 1
  `;

    return data;
  }

  async findRandomDev(numCards: number) {
    const data = await this.prisma.$queryRaw`
      SELECT
        sub.*
      FROM (
        SELECT
          g.igdb_id AS "igdbId",
          g.name,
          g.image_url AS "imageUrl",
          ${bgOther1} AS "bgStatus",
          ((g.first_release_date)::int) AS frd,
          to_char(to_timestamp((g.first_release_date)::bigint), 'YYYY-MM-DD') as "frdFormatted"
        FROM games g
        WHERE g.igdb_id = ANY(${testGameIgdbIds})
        AND g.first_release_date IS NOT NULL
        ORDER BY frd
        LIMIT ${numCards}
      ) sub
      ORDER BY sub.frd ASC
    `;

    return data;
  }

  async findOneRandomDev(idlist?: number[]) {
    const data = await this.prisma.$queryRaw`
        SELECT
          g.igdb_id AS "igdbId",
          g.name,
          g.image_url AS "imageUrl",
          ${bgOther1} AS "bgStatus",
          ((g.first_release_date)::int) AS frd,
          to_char(to_timestamp((g.first_release_date)::bigint), 'YYYY-MM-DD') as "frdFormatted"
        FROM games g
        WHERE g.first_release_date IS NOT NULL
        AND g.igdb_id != ANY(${whichList(idlist)})
        AND g.igdb_id = ANY(${testGameIgdbIds})
        -- AND g.igdb_id = 99999999
        ORDER BY RANDOM()
        LIMIT 1
    `;

    return data;
  }
}
