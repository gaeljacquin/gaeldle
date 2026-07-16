import { oc } from '@orpc/contract';
import { z } from 'zod';
import { GameSelectSchema } from './schema';

export const ClueContract = {
  generateClue: oc
    .route({ method: 'POST', path: '/clue/generate-clue' })
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
