import { Injectable } from '@nestjs/common';
import { PrismaService } from '~/src/prisma/prisma.service';
import { upstashRedisInit } from '~/utils/upstash-redis';
import keyNameByEnv from '~/utils/key-name-env';

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const key = keyNameByEnv('games');
    let games;

    try {
      games = await this.prisma.games.findMany({
        select: {
          igdbId: true,
          name: true,
          info: true,
          imageUrl: true,
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
}
