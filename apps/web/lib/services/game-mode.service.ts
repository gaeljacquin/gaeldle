import { gameModeSelectSchema, type GameMode } from '@workspace/api-contract';
import { z } from 'zod';
import { queryOptions } from '@tanstack/react-query';

export const getGameModes = async (): Promise<GameMode[]> => {
  try {
    const res = await fetch('/api/game-modes');

    if (!res.ok) {
      throw new Error('Failed to fetch game modes');
    }

    const gameModes = z.array(gameModeSelectSchema).parse(await res.json());
    const levelCounts: Record<string, number> = {};

    return gameModes.map((gameMode) => {
      const { level, slug } = gameMode;
      levelCounts[level] ??= 1;
      const gradient = `--gradient-${level}-${levelCounts[level]}`;
      levelCounts[level]++;

      return {
        ...gameMode,
        icon: 'IconDeviceGamepad2',
        href: `/${slug}`,
        gradient,
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
export async function getGameModeBySlug(slug: string): Promise<GameMode> {
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
