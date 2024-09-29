import { ServiceUnavailableException, Injectable } from '@nestjs/common';
import { PrismaService } from '~/src/prisma/prisma.service';
import { nextDay } from '~/utils/get-current-day';
import { CreateGotdDto } from '~/src/gotd/dto/create-gotd.dto';
import { genKey } from '~/utils/env-checks';
import { upstashRedisInit } from '~/utils/upstash-redis';

@Injectable()
export class GotdService {
  constructor(private readonly prisma: PrismaService) {}

  async refreshIt(modeId) {
    const key = await this.findKey(modeId);
    const gotd = await this.findGotd(modeId);
    const hours = 6000 * 48; // 48 hours

    if (!gotd) {
      this.setGotd(modeId);
    }

    await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/set/${key}?EX=${hours}`,
      {
        method: 'POST',
        ...upstashRedisInit,
        body: JSON.stringify(gotd),
      },
    );
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

  async findGotd(modeId: number) {
    let gotd;

    try {
      gotd = await this.prisma.gotd.findFirstOrThrow({
        omit: {
          createdAt: true,
          updatedAt: true,
        },
        include: {
          games: {
            omit: {
              id: true,
              info: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          modes: {
            omit: {
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        where: {
          modeId: modeId,
          scheduled: {
            gte: nextDay,
          },
        },
      });

      return gotd;
    } catch (error) {
      console.error('Failed to fetch game of the day: ', error);
      return new ServiceUnavailableException();
    }
  }

  async setGotd(modeId: number) {
    const previousGotdIds = await this.prisma.gotd.findMany({
      select: {
        igdbId: true,
      },
      where: {
        modeId: modeId,
      },
    });
    const pgiList = previousGotdIds.map((item) => item.igdbId);
    const nextGotd = await this.prisma.$queryRaw`
        SELECT g.igdb_id AS "igdbId"
        FROM games g
        TABLESAMPLE BERNOULLI (10)
        WHERE g.igdb_id != ANY(${pgiList})
        LIMIT 1
    `;
    const data = {
      igdbId: nextGotd[0].igdbId,
      modeId,
      scheduled: nextDay,
    };
    const newGotd = this.create(data);

    return newGotd;
  }

  async create(data: CreateGotdDto) {
    try {
      const newGotd = await this.prisma.gotd.create({ data });

      return newGotd;
    } catch (error) {
      console.error('Failed to create gotd: ', error);
      throw error;
    }
  }

  async findItDev(modeId: number) {
    const gotd = await this.findGotdDev(modeId);
    return gotd;
  }

  async findGotdDev(modeId: number) {
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
        id: -1,
        modeId: modeId,
      },
    });

    return gotd;
  }
}
