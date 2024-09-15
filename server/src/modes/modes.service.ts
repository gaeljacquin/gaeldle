import { Injectable } from '@nestjs/common';
import { PrismaService } from '~/src/prisma/prisma.service';
import { genKey } from '~/utils/env-checks';
import { upstashRedisInit } from '~/utils/upstash-redis';

@Injectable()
export class ModesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const key = genKey('modes');
    let modes;

    try {
      modes = await this.prisma.modes.findMany({
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
      });

      await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/${key}`, {
        method: 'POST',
        ...upstashRedisInit,
        body: JSON.stringify(modes),
      });
    } catch (error) {
      console.error('Failed to fetch modes: ', error);
    }

    return modes ?? null;
  }

  async findOne(id) {
    const mode = await this.prisma.modes.findUniqueOrThrow({
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

    return mode;
  }
}
