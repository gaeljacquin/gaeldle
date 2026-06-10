import { oc } from '@orpc/contract';
import { z } from 'zod';

export const SampleContract = {
  uploadImage: oc
    .route({ method: 'POST', path: '/sample/upload-image' })
    .input(
      z.object({
        image: z.string(), // base64
        extension: z.string().default('jpg'),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        url: z.string(),
      }),
    ),

  sendMessage: oc
    .route({ method: 'POST', path: '/sample/send-message' })
    .input(
      z.object({
        message: z.string(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        messageId: z.string().optional(),
        message: z.string(),
      }),
    ),
} as const;
