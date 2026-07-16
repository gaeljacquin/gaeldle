import { oc } from '@orpc/contract';
import { z } from 'zod';
import { GameSelectSchema } from './schema';

export const InfoGenContract = {
  generateInfo: oc
    .route({ method: 'POST', path: '/info-gen/generate-info' })
    .input(
      z.object({
        igdbId: z.coerce.number().int().positive(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        data: GameSelectSchema,
      }),
    ),
} as const;
