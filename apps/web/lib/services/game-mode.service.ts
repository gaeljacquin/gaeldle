import {
  GameMode,
  gameModeSelectSchema,
  type GameModePlus,
} from '@workspace/api-contract';
import { z } from 'zod';
import { queryOptions } from '@tanstack/react-query';

export const getGameModes = async (): Promise<GameModePlus[]> => {
  try {
    const res = await fetch('/api/game-modes');

    if (!res.ok) {
      throw new Error('Failed to fetch game modes');
    }

    const gameModes = z.array(gameModeSelectSchema).parse(await res.json());

    return gameModes.map((gameMode) => {
      const { slug } = gameMode;

      return {
        ...gameMode,
        icon: 'IconDeviceGamepad2',
        href: `/${slug}`,
      };
    });
  } catch (e) {
    console.error('Failed to fetch game modes:', (e as Error).message);
    throw e;
  }
};

export const gameModesQueryOptions = {
  queryKey: ['gameModes'],
  queryFn: getGameModes,
};

/**
 * Get game mode by slug (pathname without leading slash)
 * @param slug - The game mode slug (e.g., "cover-art", "image-gen")
 * @returns GameMode (throws if not found)
 */
export async function getGameModeBySlug(slug: string): Promise<GameModePlus> {
  if (!slug) {
    throw new Error('Slug is required');
  }

  const modes = await getGameModes(); // let this throw naturally on failure
  const mode = modes.find((m) => m.slug === slug);

  if (!mode) {
    throw new Error(`Game mode "${slug}" not found`);
  }

  return mode;
}

export const gameModeSlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ['gameModeSlug', slug],
    queryFn: () => getGameModeBySlug(slug),
  });

export const getAllGameModes = async (): Promise<
  (GameModePlus & { id: number })[]
> => {
  try {
    const res = await fetch('/api/game-modes?all=true');

    if (!res.ok) {
      throw new Error('Failed to fetch all game modes');
    }

    const gameModeWithIdSchema = gameModeSelectSchema.extend({
      id: z.number(),
    });
    const gameModes = z.array(gameModeWithIdSchema).parse(await res.json());

    return gameModes.map((gameMode) => {
      const { slug } = gameMode;

      return {
        ...gameMode,
        icon: 'IconDeviceGamepad2',
        href: `/${slug}`,
      };
    });
  } catch (e) {
    console.error('Failed to fetch all game modes:', (e as Error).message);
    throw e;
  }
};

export const allGameModesQueryOptions = {
  queryKey: ['allGameModes'],
  queryFn: getAllGameModes,
};

export const updateGameMode = async (
  gameMode: Omit<GameMode & { id: number }, 'ordinal' | 'gradient'>,
): Promise<void> => {
  const res = await fetch('/api/game-modes', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(gameMode),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));

    throw new Error(err.error || 'Failed to update game mode');
  }
};

export const updateGameModesOrder = async (
  orders: { id: number; ordinal: number }[],
): Promise<void> => {
  const res = await fetch('/api/game-modes', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orders),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));

    throw new Error(err.error || 'Failed to update game modes order');
  }
};
