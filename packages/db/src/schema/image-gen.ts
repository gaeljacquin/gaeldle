import { z } from 'zod';
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
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

export const singleImageGenJobs = pgTable(
  'single_image_gen_job',
  {
    jobId: varchar('job_id', { length: 36 }).primaryKey(),
    batchId: varchar('batch_id', { length: 36 }),
    actorId: varchar('actor_id', { length: 255 }).notNull(),
    igdbId: integer('igdb_id').notNull(),
    artStyle: varchar('art_style', { length: 255 }),
    provider: varchar('provider', { length: 255 }).notNull(),
    input: jsonb('input'),
    status: varchar('status', { length: 16 })
      .$type<ImageGenStatus>()
      .notNull()
      .default('pending'),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(3),
    sqsMessageId: varchar('sqs_message_id', { length: 255 }),
    error: text('error'),
    resultUrl: varchar('result_url', { length: 2048 }),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }),
    completedAt: timestamp('completed_at', {
      withTimezone: true,
      mode: 'date',
    }),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('single_image_gen_job_actor_status_idx').on(
      table.actorId,
      table.status,
    ),
    index('single_image_gen_job_igdb_idx').on(table.igdbId),
    index('single_image_gen_job_batch_idx').on(table.batchId),
  ],
);

export const imageGenBatches = pgTable(
  'image_gen_batch',
  {
    batchId: varchar('batch_id', { length: 36 }).primaryKey(),
    actorId: varchar('actor_id', { length: 255 }).notNull(),
    params: jsonb('params').notNull(),
    status: varchar('status', { length: 16 })
      .$type<ImageGenStatus>()
      .notNull()
      .default('pending'),
    total: integer('total').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }),
    completedAt: timestamp('completed_at', {
      withTimezone: true,
      mode: 'date',
    }),
  },
  (table) => [
    index('image_gen_batch_actor_status_idx').on(table.actorId, table.status),
  ],
);
