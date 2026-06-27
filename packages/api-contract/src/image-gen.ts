import { oc } from '@orpc/contract';
import { z } from 'zod';
import {
  GameSelectSchema,
  ImageGenFailureSchema,
  imageGenParamSchema,
  ImageGenStatusEnum,
  artStyleSelectSchema,
} from './schema';
import { IMAGE_GEN_MIN, IMAGE_GEN_MAX } from '@workspace/shared';

export const ImageGenContract = {
  generateImage: oc
    .route({ method: 'POST', path: '/image-gen/generate-image' })
    .input(
      z.object({
        igdbId: z.coerce.number().int().positive(),
        includeStoryline: z.boolean().optional().default(false),
        includeGenres: z.boolean().optional().default(false),
        includeThemes: z.boolean().optional().default(false),
        artStyle: artStyleSelectSchema.shape.value.optional(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        messageId: z.string().optional(),
      }),
    ),

  generateImages: oc
    .route({ method: 'POST', path: '/image-gen/generate-images' })
    .input(
      z.object({
        numGames: z.number().int().min(IMAGE_GEN_MIN).max(IMAGE_GEN_MAX),
        artStyle: artStyleSelectSchema.shape.value,
        includeStoryline: z.boolean().default(false),
        includeGenres: z.boolean().default(false),
        includeThemes: z.boolean().default(false),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        imageGenId: z.string(),
        gamesQueued: z.number(),
      }),
    ),

  getImageGenStatus: oc
    .route({
      method: 'GET',
      path: '/image-gen/generate-images/:imageGenId/status',
    })
    .input(
      z.object({
        imageGenId: z.string(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        imageGenId: z.string(),
        status: ImageGenStatusEnum,
        total: z.number(),
        processed: z.number(),
        succeeded: z.number(),
        failed: z.number(),
        failures: z.array(ImageGenFailureSchema),
        params: imageGenParamSchema,
        startedAt: z.date().nullable(),
        completedAt: z.date().nullable(),
        createdAt: z.date(),
      }),
    ),
} as const;
