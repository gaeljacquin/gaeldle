import { ServiceUnavailableException, Injectable } from '@nestjs/common';
import { PrismaService } from '~/src/prisma/prisma.service';
import currentDay from '~/utils/get-current-day';
import { upstashRedisInit } from '~/utils/upstash-redis';
import { genKey } from '~/utils/env-checks';

@Injectable()
export class GotdService {
  constructor(private readonly prisma: PrismaService) {}

  async findIt(modeId: number) {
    try {
      const key = await this.findKey(modeId);
      let gotd;
      const gotdCached = await fetch(
        `${process.env.UPSTASH_REDIS_REST_URL}/get/${key}`,
        {
          method: 'GET',
          ...upstashRedisInit,
        },
      );
      gotd = JSON.parse((await gotdCached.json()).result);

      if (!gotd) {
        gotd = await this.dbFindGotd(modeId);
        await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/${key}`, {
          method: 'POST',
          ...upstashRedisInit,
          body: JSON.stringify(gotd),
        });
      }

      return gotd ?? null;
    } catch (error) {
      console.error('Failed to fetch game of the day: ', error);
      return new ServiceUnavailableException();
    }
  }

  async findKey(modeId) {
    const mode = await this.prisma.modes.findFirst({
      where: {
        id: modeId,
      },
    });
    const key = genKey(mode.mode);

    return key;
  }

  async refreshIt(modeId) {
    const key = await this.findKey(modeId);
    const gotd = await this.dbFindGotd(modeId);

    await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/${key}`, {
      method: 'POST',
      ...upstashRedisInit,
      body: JSON.stringify(gotd),
    });
  }

  async dbFindGotd(modeId: number) {
    const gotd = await this.prisma.gotd.findFirst({
      omit: {
        createdAt: true,
        updatedAt: true,
      },
      include: {
        games: {
          omit: {
            id: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        modes: {
          select: {
            mode: true,
            label: true,
            lives: true,
            pixelation: true,
            pixelationStep: true,
          },
        },
      },
      where: {
        modeId: modeId,
        scheduled: {
          gte: currentDay.start,
          lte: currentDay.end,
        },
      },
    });

    return gotd;
  }
}
