import 'server-only';

import { Prisma as Prisma2 } from '@prisma/client';
import { bgOther1, whichList } from '@/utils/constants';
import { prisma } from '@/utils/db';

export async function getGames() {
  const games = await prisma.games.findMany({
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

export async function getGame(igdbId: number) {
  const game = await prisma.games.findFirstOrThrow({
    omit: {
      id: true,
      createdAt: true,
      updatedAt: true,
    },
    where: {
      igdbId,
    },
  });

  return game;
}

export async function getRandom(numCards: number, sampleSize: number) {
  const data = await prisma.$queryRaw`
      SELECT
        sub.*
      FROM (
        SELECT
          g.igdb_id AS "igdbId", -- double quotes to retain case
          g.name,
          g.image_url AS "imageUrl",
          ${bgOther1} AS "bgStatus",
          ((g.first_release_date)::int) AS frd,
          to_char(to_timestamp((g.first_release_date)::bigint), 'YYYY-MM-DD') as "frdFormatted"
        FROM games g
        TABLESAMPLE BERNOULLI (${sampleSize})
        WHERE g.first_release_date IS NOT NULL
        LIMIT ${numCards}
      ) sub
      ORDER BY sub.frd
    `;

  return data;
}

export async function getOneRandom(idlist?: number[]) {
  const data = await prisma.$queryRaw`
      SELECT
        g.igdb_id AS "igdbId", -- double quotes to retain case
        g.name,
        g.image_url AS "imageUrl",
        ${bgOther1} AS "bgStatus",
        ((g.first_release_date)::int) AS frd,
        to_char(to_timestamp((g.first_release_date)::bigint), 'YYYY-MM-DD') as "frdFormatted"
      FROM games g
      WHERE g.first_release_date IS NOT NULL
      AND g.igdb_id NOT IN (${Prisma2.join(whichList(idlist ?? []))})
      ORDER BY RANDOM()
      LIMIT 1
    `;

  return data;
}

export type Games = Prisma2.PromiseReturnType<typeof getGames>;
export type Game = Prisma2.PromiseReturnType<typeof getGame>;
