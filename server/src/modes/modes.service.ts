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
            // temporary hard-coding
            where: {
              id: 1,
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
}
