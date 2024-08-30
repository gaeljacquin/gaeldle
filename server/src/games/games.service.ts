import { Injectable } from '@nestjs/common';
import { PrismaService } from '~/src/prisma/prisma.service';
import { RedisService } from '~/src/redis/redis.service';

@Injectable()
export class GamesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
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
}
