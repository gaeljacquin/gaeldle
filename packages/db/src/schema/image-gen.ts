import { z } from 'zod';
import { artStyleSelectSchema } from './art-style';

export const ImageGenFailureSchema = z.object({
  igdbId: z.number(),
  gameName: z.string(),
  error: z.string(),
});

export const imageGenParamSchema = z.object({
  numGames: z.number(),
  artStyle: artStyleSelectSchema.shape.value,
  includeStoryline: z.boolean(),
  includeGenres: z.boolean(),
  includeThemes: z.boolean(),
});

export const imageGenStatus = {
  pending: { label: 'Pending', variant: 'secondary', active: true },
  running: { label: 'Running', variant: 'default', active: true },
  completed: { label: 'Completed', variant: 'default', active: false },
  failed: { label: 'Failed', variant: 'destructive', active: false },
} as const;

export const imageGenStatusPlus = {
  ...imageGenStatus,
  idle: { label: 'Idle', variant: 'outline', active: true },
} as const;

export type ImageGenStatus = keyof typeof imageGenStatus;
export type ImageGenStatusPlus = keyof typeof imageGenStatusPlus;

export const ImageGenStatusEnum = z.enum(
  Object.keys(imageGenStatus) as [ImageGenStatus, ...ImageGenStatus[]],
);

export const ImageGenStatusPlusEnum = z.enum(
  Object.keys(imageGenStatusPlus) as [
    ImageGenStatusPlus,
    ...ImageGenStatusPlus[],
  ],
);

export const activeImageGenStatus = (
  Object.keys(imageGenStatusPlus) as Array<keyof typeof imageGenStatusPlus>
).filter(
  (key): key is ImageGenStatus =>
    key in imageGenStatus && imageGenStatusPlus[key].active,
);
