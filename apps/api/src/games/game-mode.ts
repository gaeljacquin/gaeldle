export const GAME_MODE_SLUGS = [
  'cover-art',
  'image-gen',
  'artwork',
  'timeline',
  'timeline-2',
  'specifications',
] as const;

export type GameModeSlug = (typeof GAME_MODE_SLUGS)[number];

export const isGameModeSlug = (value: unknown): value is GameModeSlug =>
  typeof value === 'string' &&
  (GAME_MODE_SLUGS as readonly string[]).includes(value);
