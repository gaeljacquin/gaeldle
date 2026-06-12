import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  json,
  index,
} from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { artStyleSelectSchema } from './art-style';

export const bulkImageGenJobs = pgTable('bulk_image_gen_job', {
  id: serial('id').primaryKey(),
  jobId: varchar('job_id').unique().notNull(),
  status: varchar('status').notNull(), // 'pending'|'running'|'completed'|'failed'
  total: integer('total').notNull(),
  processed: integer('processed').notNull().default(0),
  succeeded: integer('succeeded').notNull().default(0),
  failed: integer('failed').notNull().default(0),
  failures:
    json('failures').$type<
      Array<{ igdbId: number; gameName: string; error: string }>
    >(),
  params: json('params').notNull().$type<{
    numGames: number;
    artStyle: string; // really just artStyleValue, not renaming it
    includeStoryline: boolean;
    includeGenres: boolean;
    includeThemes: boolean;
  }>(),
  startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }),
  completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  }).defaultNow(),
});

export type BulkImageJob = typeof bulkImageGenJobs.$inferSelect;
export type BulkImageJobInsert = typeof bulkImageGenJobs.$inferInsert;

export const BulkJobFailureSchema = z.object({
  igdbId: z.number(),
  gameName: z.string(),
  error: z.string(),
});

export const BulkJobParamsSchema = z.object({
  numGames: z.number(),
  artStyle: artStyleSelectSchema.shape.value, // effectively artStyleValue, not renaming this to be consistent with bulkImageGenJobs
  includeStoryline: z.boolean(),
  includeGenres: z.boolean(),
  includeThemes: z.boolean(),
});

export const BulkJobStatusEnum = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
]);

export const BulkJobSummarySchema = z.object({
  jobId: z.string(),
  status: BulkJobStatusEnum,
  total: z.number(),
  processed: z.number(),
  succeeded: z.number(),
  failed: z.number(),
  params: BulkJobParamsSchema,
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  createdAt: z.date(),
});

export type BulkJobSummary = z.infer<typeof BulkJobSummarySchema>;

export const domainEvents = pgTable(
  'domain_event',
  {
    id: serial('id').primaryKey(),
    eventType: varchar('event_type', { length: 64 }).notNull(),
    actorId: varchar('actor_id', { length: 255 }).notNull(),
    occurredAt: timestamp('occurred_at', {
      withTimezone: true,
      mode: 'date',
    }).defaultNow(),
    payload: json('payload').notNull(),
  },
  (table) => [
    index('domain_event_type_idx').on(table.eventType),
    index('domain_event_occurred_idx').on(table.occurredAt),
  ],
);

export type DomainEvent = typeof domainEvents.$inferSelect;
export type DomainEventInsert = typeof domainEvents.$inferInsert;
