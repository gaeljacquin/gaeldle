import { sql } from 'drizzle-orm';
import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  check,
  pgMaterializedView,
  json,
  index,
} from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { artStyleSelectSchema } from './art-style';
import { createSelectSchema } from 'drizzle-zod';

export const bigJobTable = pgTable(
  'bulk_image_gen_job',
  {
    id: serial('id').primaryKey(),
    jobId: varchar('job_id').unique().notNull(),
    status: varchar('status').notNull(),
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
    completedAt: timestamp('completed_at', {
      withTimezone: true,
      mode: 'date',
    }),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date',
    }).defaultNow(),
  },
  (table) => [
    check(
      'big_job_status_check',
      sql`${table.status} IN ${sql.raw(
        `(${Object.keys(jobStatus)
          .map((s) => `'${s}'`)
          .join(', ')})`,
      )}`,
    ),
    index('big_job_jobId_idx').on(table.jobId),
  ],
);

export type BigJob = typeof bigJobTable.$inferSelect;
export type BigJobInsert = typeof bigJobTable.$inferInsert;

export const BigJobFailureSchema = z.object({
  igdbId: z.number(),
  gameName: z.string(),
  error: z.string(),
});

export const bigJobObject = {
  jobId: bigJobTable.jobId,
  status: bigJobTable.status,
  total: bigJobTable.total,
  processed: bigJobTable.processed,
  succeeded: bigJobTable.succeeded,
  failed: bigJobTable.failed,
  failures: bigJobTable.failures,
  params: bigJobTable.params,
  startedAt: bigJobTable.startedAt,
  completedAt: bigJobTable.completedAt,
};

export const bigJobParamSchema = z.object({
  numGames: z.number(),
  artStyle: artStyleSelectSchema.shape.value,
  includeStoryline: z.boolean(),
  includeGenres: z.boolean(),
  includeThemes: z.boolean(),
});

export const bigJobs = pgMaterializedView('big_jobs').as((qb) => {
  return qb
    .select(bigJobObject)
    .from(bigJobTable)
    .orderBy(bigJobObject.startedAt, bigJobObject.completedAt);
});

export const bigJobSelectSchema = createSelectSchema(bigJobs);

export type BigJobSummary = z.infer<typeof bigJobSummaryObject>;
// export type BigJobStatus = z.infer<typeof bigJobSelectSchema>['status'];

export const jobStatus = {
  pending: { label: 'Pending', variant: 'secondary', active: true },
  running: { label: 'Running', variant: 'default', active: true },
  completed: { label: 'Completed', variant: 'default', active: false },
  failed: { label: 'Failed', variant: 'destructive', active: false },
} as const;

export const jobStatusPlus = {
  ...jobStatus,
  idle: { label: 'Idle', variant: 'outline', active: true }, // idle didn't have a variant prior, this one's random
} as const;

// export const activeJobStatus = (
//   Object.keys(jobStatusPlus) as Array<keyof typeof jobStatusPlus>
// ).filter((key) => jobStatus[key].active);

export const activeJobStatus = (
  Object.keys(jobStatusPlus) as Array<keyof typeof jobStatusPlus>
).filter(
  (key): key is JobStatus => key in jobStatus && jobStatusPlus[key].active,
);

export type JobStatus = keyof typeof jobStatus;
export type JobStatusPlus = keyof typeof jobStatusPlus;

export const JobStatusEnum = z.enum(
  Object.keys(jobStatus) as [JobStatus, ...JobStatus[]],
);

export const JobStatusPlusEnum = z.enum(
  Object.keys(jobStatusPlus) as [JobStatusPlus, ...JobStatusPlus[]],
);

const bigJobSummaryObject = z.object({
  jobId: z.string(),
  status: JobStatusEnum,
  total: z.number(),
  processed: z.number(),
  succeeded: z.number(),
  failed: z.number(),
  params: bigJobParamSchema,
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  createdAt: z.date(),
});
