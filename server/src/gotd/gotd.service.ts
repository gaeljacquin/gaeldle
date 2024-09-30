import { Injectable } from '@nestjs/common';
import { PrismaService } from '~/src/prisma/prisma.service';
import { ModesService } from '~/src/modes/modes.service';
import { CreateGotdDto } from '~/src/gotd/dto/create-gotd.dto';
import { upstashRedisInit } from '~/utils/upstash-redis';
import { cacheDuration, today, tomorrow } from '~/utils/constants';
import shuffleList from '~/utils/shuffle-list';

@Injectable()
export class GotdService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly modesService: ModesService,
  ) {}

  async refreshGotd(modeId) {
    const key = await this.modesService.findKey(modeId, true);
    let gotd = await this.findGotd(modeId, true);

    if (!gotd) {
      gotd = await this.setGotd(modeId);
    }

    this.setGotdCached(gotd, key);

    return gotd;
  }

  async findGotd(modeId: number, future = false) {
    const day = future ? tomorrow : today;
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
              ...(modeId === 2 ? { artworks: { not: null } } : undefined),
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
            gte: future ? day.start : undefined,
            lte: day.end,
          },
        },
        orderBy: {
          scheduled: 'desc',
        },
      });
    } catch (error) {
      !future && console.error('Failed to fetch game of the day: ', error);
      return null;
    }

    return gotd;
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
    const gotdIds = await this.prisma.games.findMany({
      select: {
        igdbId: true,
        artworks: modeId === 2 ? true : undefined,
      },
      where: {
        igdbId: {
          notIn: previousGotdIds.map((row) => row.igdbId),
        },
        ...(modeId === 2 ? { artworks: { not: null } } : undefined),
      },
    });
    const nextGotd = shuffleList(gotdIds)[0];
    const data = {
      igdbId: nextGotd.igdbId,
      modeId,
      scheduled: tomorrow.start,
    };

    if (modeId === 2) {
      const artworks = nextGotd.artworks;
      const artwork = artworks
        ? artworks[Math.floor(Math.random() * artworks.length)]
        : null;
      const info = {
        imageUrl: artwork?.url.replace('t_thumb', 't_720p') ?? '',
      };

      if (info.imageUrl.startsWith('http')) {
        info.imageUrl = `https${info.imageUrl.slice(4)}`;
      } else if (!info.imageUrl.startsWith('https')) {
        info.imageUrl = `https:${info.imageUrl}`;
      }

      data['info'] = info;
    }

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
      `${process.env.UPSTASH_REDIS_REST_URL}/set/${key}?EX=${cacheDuration}`,
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
