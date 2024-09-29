import { ServiceUnavailableException, Injectable } from '@nestjs/common';
import { PrismaService } from '~/src/prisma/prisma.service';
import { CreateGotdDto } from '~/src/gotd/dto/create-gotd.dto';
import { genKey } from '~/utils/env-checks';
import { upstashRedisInit } from '~/utils/upstash-redis';
import { today, tomorrow } from '~/utils/constants';

@Injectable()
export class GotdService {
  constructor(private readonly prisma: PrismaService) {}

  private hours = 6000 * 48; // 48 hours

  async refreshIt(modeId) {
    const key = await this.findKey(modeId, true);
    const gotd = await this.findGotd(modeId);

    if (!gotd) {
      this.setGotd(modeId);
    }

    this.setGotdCached(gotd, key);
  }

  async findGotd(modeId: number) {
    const key = await this.findKey(modeId);
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
            where: {
              ...(modeId === 3 ? { keywords: { not: null } } : {}),
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
            gte: today.start,
            lte: today.end,
          },
        },
      });

      this.setGotdCached(gotd, key);

      return gotd;
    } catch (error) {
      console.error('Failed to fetch game of the day: ', error);
      return new ServiceUnavailableException();
    }
  }

  async findKey(modeId, future = false) {
    const day = future ? tomorrow : today;
    const mode = await this.prisma.modes.findFirst({
      where: {
        id: modeId,
      },
    });
    const key = genKey(mode.mode) + `-${day.start.toISOString().split('T')[0]}`;

    return key;
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
        ${modeId === 3 ? 'AND keywords IS NOT NULL' : ''}
        LIMIT 1
    `;
    const data = {
      igdbId: nextGotd[0].igdbId,
      modeId,
      scheduled: tomorrow.start,
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

  async setGotdCached(gotd, key) {
    await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/set/${key}?EX=${this.hours}`,
      {
        method: 'POST',
        ...upstashRedisInit,
        body: JSON.stringify(gotd),
      },
    );
  }

  async getGotdCached(key) {
    const gotdCached = await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/get/${key}`,
      {
        method: 'GET',
        ...upstashRedisInit,
      },
    );

    return gotdCached;
  }
}
