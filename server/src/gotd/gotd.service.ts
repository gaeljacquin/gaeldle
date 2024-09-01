import { ServiceUnavailableException, Injectable } from '@nestjs/common';
import { PrismaService } from '~/src/prisma/prisma.service';
import { RedisService } from '~/src/redis/redis.service';
import currentDay from '~/utils/get-current-day';

@Injectable()
export class GotdService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async findIt(modeId: number) {
    try {
      const key = await this.findKey(modeId);
      let gotd = await this.redisService.getData(key);
      let gotd2;

      if (!gotd) {
        gotd2 = JSON.stringify(await this.dbFindGotd(modeId));
        gotd = JSON.parse(gotd2);
        await this.redisService.setData(key, gotd2);
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
    const key = 'gotd_' + mode.mode;

    return key;
  }

  async refreshIt(modeId) {
    const key = await this.findKey(modeId);
    const gotd = await this.dbFindGotd(modeId);
    await this.redisService.setData(key, JSON.stringify(gotd));
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
