import { Injectable } from '@nestjs/common';
import { PrismaService } from '~/src/prisma/prisma.service';
import { genKey } from '~/utils/env-checks';
import { upstashRedisInit } from '~/utils/upstash-redis';
import { UpdateModesDto } from './dto/update-modes.dto';

@Injectable()
export class ModesService {
  constructor(private readonly prisma: PrismaService) {}

  private key = genKey('modes');

  async findAll() {
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

      this.setCachedModes(modes);
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

  async myEdit(id: number, data: UpdateModesDto) {
    try {
      const updates = {};
      Object.keys(data).forEach((key) => {
        updates[key] = data[key];
      });

      await this.prisma.modes.update({
        where: { id },
        data: updates,
      });

      await this.findAll(); // refreshes cache
    } catch (error) {
      console.error('Failed to update mode: ', error);
      throw error;
    }
  }

  async setCachedModes(data) {
    await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/${this.key}`, {
      method: 'POST',
      ...upstashRedisInit,
      body: JSON.stringify(data),
    });
  }
}
