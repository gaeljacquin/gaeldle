import 'server-only';

import { Prisma as Prisma2 } from '@prisma/client';
import { prisma } from '@/utils/db';

export async function getModes() {
  const modes = await prisma.modes.findMany({
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

  return modes;
}

export async function getMode(id: number) {
  const mode = await prisma.modes.findUniqueOrThrow({
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

export async function getModeBySlug(slug: string) {
  const mode = await prisma.modes.findUniqueOrThrow({
    where: {
      mode: slug,
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

export type Modes = Prisma2.PromiseReturnType<typeof getModes>;
export type Mode = Prisma2.PromiseReturnType<typeof getModeBySlug>;
