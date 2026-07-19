import { oc } from '@orpc/contract';
import { z } from 'zod';
import { GameSelectSchema, GameClueHistorySchema } from './schema';

export const ClueContract = {
  generateClue: oc
    .route({ method: 'POST', path: '/clue/generate-clue' })
    .input(
      z.object({
        igdbId: z.coerce.number().int().positive(),
        provider: z.string(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        data: GameSelectSchema,
      }),
    ),

  getClueHistory: oc
    .route({ method: 'GET', path: '/clue/history' })
    .input(
      z.object({
        igdbId: z.coerce.number().int().positive(),
      }),
    )
    .output(z.array(GameClueHistorySchema)),

  restoreClue: oc
    .route({ method: 'POST', path: '/clue/restore' })
    .input(
      z.object({
        igdbId: z.coerce.number().int().positive(),
        historyId: z.number().int().positive(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        data: GameSelectSchema,
      }),
    ),
} as const;
