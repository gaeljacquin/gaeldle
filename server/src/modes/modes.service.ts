import { Injectable } from '@nestjs/common';
import { PrismaService } from '~/src/prisma/prisma.service';
import { RedisService } from '~/src/redis/redis.service';

@Injectable()
export class ModesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async findAll() {
    const key = 'modes';
    let modes = await this.redisService.getData(key);

    if (!modes) {
      try {
        const modes2 = JSON.stringify(
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

        modes = JSON.parse(modes2);
        await this.redisService.setData(key, modes2);
      } catch (error) {
        console.error('Failed to fetch modes: ', error);
      }
    }

    return modes ?? null;
  }

  async findOne(id) {
    const key = 'modes';
    const modes = await this.redisService.getData(key);
    let mode;

    if (!modes) {
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
      mode = modes.find((mode) => mode.id === id);
    }

    return mode ?? null;
  }
}
