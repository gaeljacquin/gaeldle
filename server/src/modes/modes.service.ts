import { Injectable } from '@nestjs/common';
import { PrismaService } from '~/src/prisma/prisma.service';
import { upstashRedisInit } from '~/utils/upstash-redis';

@Injectable()
export class ModesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    let key = 'modes';

    if (
      process.env.NODE_ENV === 'dev' ||
      process.env.NODE_ENV === 'development'
    ) {
      key += '_dev';
    }

    let modes = await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/get/${key}`,
      upstashRedisInit,
    );
    let modes2 = await (await modes.json()).result;

    if (!modes2) {
      try {
        modes2 = JSON.stringify(
          await this.prisma.modes.findMany({
            where: {
              hidden: false,
              categories: {
                active: true,
              },
            },
            omit: {
              createdAt: true,
              updatedAt: true,
            },
            include: {
              levels: {
                select: {
                  id: true,
                  level: true,
                  label: true,
                  classNames: true,
                },
              },
              categories: {
                select: {
                  id: true,
                  category: true,
                  label: true,
                },
              },
            },
            orderBy: [{ categoryId: 'asc' }, { ordinal: 'asc' }],
          }),
        );

        await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/${key}`, {
          method: 'POST',
          ...upstashRedisInit,
          body: modes2,
        });
      } catch (error) {
        console.error('Failed to fetch modes: ', error);
      }
    }

    modes = JSON.parse(modes2);

    return modes ?? null;
  }

  async findOne(id) {
    let key = 'modes';

    if (
      process.env.NODE_ENV === 'dev' ||
      process.env.NODE_ENV === 'development'
    ) {
      key += '_dev';
    }

    const modes = await fetch(
      `${process.env.UPSTASH_REDIS_REST_URL}/get/${key}`,
      upstashRedisInit,
    );
    const modes2 = await (await modes.json()).result;
    let mode;

    if (!modes2) {
      mode = await this.prisma.modes.findUniqueOrThrow({
        where: {
          id: id,
          active: true,
          hidden: false,
        },
        omit: {
          createdAt: true,
          updatedAt: true,
        },
        include: {
          levels: {
            select: {
              level: true,
              label: true,
            },
          },
        },
      });
    } else {
      const modes3 = JSON.parse(modes2);
      mode = modes3.find((mode) => mode.id === id);
    }

    return mode ?? null;
  }
}
