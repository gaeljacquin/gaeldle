import { oc } from '@orpc/contract';
import { z } from 'zod';
import { DISCOVER_GAMES_MAX } from '@gaeldle/constants';

export const DiscoverCandidateSchema = z.object({
  igdbId:           z.number(),
  name:             z.string(),
  firstReleaseDate: z.number().nullable(),
  coverUrl:         z.string().nullable(),
  totalRating:      z.number().nullable(),
  totalRatingCount: z.number().nullable(),
  genres:           z.array(z.string()),
  platforms:        z.array(z.string()),
  isAlreadyAdded:   z.boolean(),
});

export type DiscoverCandidate = z.infer<typeof DiscoverCandidateSchema>;

export const DiscoverApplyResultSchema = z.object({
  igdbId:  z.number(),
  name:    z.string().nullable(),
  status:  z.enum(['created', 'updated', 'error']),
  error:   z.string().nullable(),
});

export type DiscoverApplyResult = z.infer<typeof DiscoverApplyResultSchema>;

export const DiscoverContract = {
  scan: oc
    .route({ method: 'POST', path: '/discover/scan' })
    .input(
      z.object({
        count: z.number().int().min(1).max(DISCOVER_GAMES_MAX),
      }),
    )
    .output(
      z.object({
        scanEventId:       z.number(),
        candidates:        z.array(DiscoverCandidateSchema),
        totalReturned:     z.number(),
        alreadyAddedCount: z.number(),
      }),
    ),

  apply: oc
    .route({ method: 'POST', path: '/discover/apply' })
    .input(
      z.object({
        scanEventId:      z.number().int().positive(),
        selectedIgdbIds:  z.array(z.number().int().positive()).min(1).max(DISCOVER_GAMES_MAX),
      }),
    )
    .output(
      z.object({
        success:      z.boolean(),
        applyEventId: z.number(),
        results:      z.array(DiscoverApplyResultSchema),
      }),
    ),
} as const;
