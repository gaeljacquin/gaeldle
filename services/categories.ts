import 'server-only';

import { Prisma as Prisma2 } from '@prisma/client';
import { prisma } from '@/utils/db';

export async function getCategories() {
  const categories = await prisma.categories.findMany({
    where: {
      active: true,
    },
    omit: {
      description: true,
      createdAt: true,
      updatedAt: true,
    },
    include: {
      _count: {
        select: {
          modes: {
            where: {
              active: true,
              hidden: false,
            },
          },
        },
      },
    },
    orderBy: [{ id: 'asc' }],
  });

  return categories;
}

export type Categories = Prisma2.PromiseReturnType<typeof getCategories>;
