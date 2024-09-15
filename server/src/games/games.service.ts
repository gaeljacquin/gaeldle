import { Injectable } from '@nestjs/common';
import { PrismaService } from '~/src/prisma/prisma.service';
import { upstashRedisInit } from '~/utils/upstash-redis';

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const key = 'games';
    let games;

    try {
      const gamesCached = await fetch(
        `${process.env.UPSTASH_REDIS_REST_URL}/get/${key}`,
        {
          method: 'GET',
          ...upstashRedisInit,
        },
      );
      games = JSON.parse((await gamesCached.json()).result);

      if (!games) {
        games = await this.dbFindGames();
        await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/${key}`, {
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

  async dbFindGames() {
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
}
