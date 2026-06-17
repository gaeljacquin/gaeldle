import { gameModeSelectSchema, GameMode } from '@workspace/api-contract';
import { z } from 'zod';

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
 * @returns GameMode or undefined if not found
 */
export async function getGameModeBySlug(
  slug: string,
): Promise<GameMode | undefined> {
  if (!slug) {
    return undefined;
  }

  const modes = await getGameModes();

  return modes.find((mode) => mode.slug === slug);
}

export const gameModeSlugQueryOptions = (slug: string) => {
  return {
    queryKey: ['gameModeSlug', slug],
    queryFn: () => getGameModeBySlug(slug),
  };
};
