import { ServiceUnavailableException, Injectable } from '@nestjs/common';
import { PrismaService } from '~/src/prisma/prisma.service';
import currentDay from '~/utils/get-current-day';
import { upstashRedisInit } from '~/utils/upstash-redis';

@Injectable()
export class GotdService {
  constructor(private readonly prisma: PrismaService) {}

  async findIt(modeId: number) {
    try {
      let key = await this.findKey(modeId);

      if (
        process.env.NODE_ENV === 'dev' ||
        process.env.NODE_ENV === 'development'
      ) {
        key += '_dev';
      }

      let gotd = await fetch(
        `${process.env.UPSTASH_REDIS_REST_URL}/get/${key}`,
        upstashRedisInit,
      );
      let gotd2 = await (await gotd.json()).result;

      if (!gotd2) {
        gotd2 = JSON.stringify(await this.dbFindGotd(modeId));
        await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/${key}`, {
          method: 'POST',
          ...upstashRedisInit,
          body: gotd2,
        });
      }

      gotd = JSON.parse(gotd2);

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
    let key = 'gotd_' + mode.mode;

    if (
      process.env.NODE_ENV === 'dev' ||
      process.env.NODE_ENV === 'development'
    ) {
      key += '_dev';
    }

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
