import { gameModeSelectSchema } from '@workspace/api-contract';
import { z } from 'zod';

export const getGameModes = async () => {
  const res = await fetch('/api/game-modes');

  if (!res.ok) {
    throw new Error('Failed to fetch game modes');
  }

  const gameModes = z.array(gameModeSelectSchema).parse(await res.json());
  const levelCounts: Record<string, number> = {};

  return gameModes.map((gameMode) => {
    const { level } = gameMode;
    levelCounts[level] ??= 1;
    const gradient = `--gradient-${level}-${levelCounts[level]}`;
    levelCounts[level]++;

    return { ...gameMode, gradient };
  });
};

export const gameModeLevels = (await getGameModes()).map(
  (gameMode) => gameMode.title,
);

export const gameModeLevelsEnum = z.enum(gameModeLevels);

export const coverArtSlugs = (await getGameModes())
  .filter((gameMode) => gameMode.isCoverArt === 1)
  .map((gameMode) => gameMode.slug);

export const coverArtSlugsEnum = z.enum(coverArtSlugs);

export type GameMode = Awaited<ReturnType<typeof getGameModes>>[number];
export type GameModeLevelsEnumType = z.infer<typeof gameModeLevelsEnum>;
export type CoverArtSlugs = z.infer<typeof coverArtSlugsEnum>;

export const gameModesQueryOptions = {
  queryKey: ['gameModes'],
  queryFn: getGameModes,
};

/**
 * Get game mode by slug (pathname without leading slash)
 * @param slug - The game mode slug (e.g., "cover-art", "image-gen")
 * @returns GameMode or undefined if not found
 */
export async function getGameModeBySlug(slug: string) {
  const mode = (await getGameModes()).find((mode) => mode.slug === slug);

  if (!mode) {
    throw new Error(`Game mode not found: ${slug}`);
  }

  return mode;
}

export const gameModeSlugQueryOptions = (slug: string) => {
  return {
    queryKey: ['gameModeSlug', slug],
    queryFn: () => getGameModeBySlug(slug),
  };
};
