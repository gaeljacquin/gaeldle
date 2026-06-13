import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  GameSelectSchema,
  BigJobFailureSchema,
  bigJobParamSchema,
  JobStatusEnum,
  artStyleSelectSchema,
} from './schema';
import { IMAGE_GEN_MIN, IMAGE_GEN_MAX } from '@workspace/shared';

export const BigContract = {
  generateImage: oc
    .route({ method: 'POST', path: '/big/generate-image' })
    .input(
      z.object({
        igdbId: z.coerce.number().int().positive(),
        includeStoryline: z.boolean().optional().default(false),
        includeGenres: z.boolean().optional().default(false),
        includeThemes: z.boolean().optional().default(false),
        artStyle: artStyleSelectSchema.shape.value.optional(), // effectively artStyleValue, not renaming this to be consistent with bulkImageGenJobs
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        url: z.string(),
        data: GameSelectSchema,
      }),
    ),

  bulkGenerateImages: oc
    .route({ method: 'POST', path: '/big/generate-images' })
    .input(
      z.object({
        numGames: z.number().int().min(IMAGE_GEN_MIN).max(IMAGE_GEN_MAX),
        artStyle: artStyleSelectSchema.shape.value, // effectively artStyleValue, not renaming this to be consistent with bulkImageGenJobs
        includeStoryline: z.boolean().default(false),
        includeGenres: z.boolean().default(false),
        includeThemes: z.boolean().default(false),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        jobId: z.string(),
        gamesQueued: z.number(),
      }),
    ),

  getBulkJobStatus: oc
    .route({ method: 'GET', path: '/big/generate-images/:jobId/status' })
    .input(
      z.object({
        jobId: z.string(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        jobId: z.string(),
        status: JobStatusEnum,
        total: z.number(),
        processed: z.number(),
        succeeded: z.number(),
        failed: z.number(),
        failures: z.array(BigJobFailureSchema),
        params: bigJobParamSchema,
        startedAt: z.date().nullable(),
        completedAt: z.date().nullable(),
        createdAt: z.date(),
      }),
    ),
} as const;
