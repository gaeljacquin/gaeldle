import { Injectable } from '@nestjs/common';
import { PrismaService } from '~/src/prisma/prisma.service';
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
}
