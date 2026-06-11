import {
  sql,
  eq,
} from 'drizzle-orm';
import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  json,
  pgMaterializedView,
  index,
  text,
  check,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const games = pgTable(
  'game',
  {
    id: serial('id').primaryKey(),
    igdbId: integer('igdb_id').notNull().unique('games_igdb_key'),
    name: varchar('name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date',
    }).defaultNow(),
    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    }).defaultNow(),
    imageUrl: varchar('image_url'),
    aiImageUrl: varchar('ai_image_url'),
    aiPrompt: varchar('ai_prompt'),
    imageGen: json('image_gen').$type<
      Array<
        Record<
          string,
          {
            url: string;
            prompt: string;
            provider: string;
          }
        >
      >
    >(),
    artworks: json('artworks').$type<any>(),
    keywords: json('keywords').$type<any>(),
    franchises: json('franchises').$type<any>(),
    gameEngines: json('game_engines').$type<any>(),
    gameModes: json('game_modes').$type<any>(),
    genres: json('genres').$type<any>(),
    involvedCompanies: json('involved_companies').$type<any>(),
    platforms: json('platforms').$type<any>(),
    playerPerspectives: json('player_perspectives').$type<any>(),
    releaseDates: json('release_dates').$type<any>(),
    themes: json('themes').$type<any>(),
    firstReleaseDate: integer('first_release_date'),
    summary: text('summary'),
    storyline: text('storyline'),
  },
  (table) => [index('game_name_idx').on(table.name)],
);

export const gameObject = {
  id: games.id,
  igdbId: games.igdbId,
  name: games.name,
  imageUrl: games.imageUrl,
  aiImageUrl: games.aiImageUrl,
  aiPrompt: games.aiPrompt,
  imageGen: games.imageGen,
  artworks: games.artworks,
  keywords: games.keywords,
  franchises: games.franchises,
  gameEngines: games.gameEngines,
  gameModes: games.gameModes,
  genres: games.genres,
  involvedCompanies: games.involvedCompanies,
  platforms: games.platforms,
  playerPerspectives: games.playerPerspectives,
  releaseDates: games.releaseDates,
  themes: games.themes,
  firstReleaseDate: games.firstReleaseDate,
  summary: games.summary,
  storyline: games.storyline,
};

export const allGames = pgMaterializedView('all_games').as((qb) => {
  return qb.select(gameObject).from(games).orderBy(games.name);
});

export const GameSelectSchema = createSelectSchema(allGames);
export const GameInsertSchema = createInsertSchema(games);
export const GameUpdateInputSchema = GameInsertSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  igdbId: true,
}).partial();
export type GameUpdate = z.infer<typeof GameUpdateInputSchema>;
export type Game = typeof allGames.$inferSelect;

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
    artStyle: string;
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
  artStyle: z.string(),
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

const artStylesTable = pgTable(
  'art_style',
  {
    id: serial('id').primaryKey(),
    value: text('value').notNull().unique(),
    label: text('label').notNull(),
    description: text('description').notNull(),
    isDefault: integer('is_default').notNull().default(0),
    isActive: integer('is_active').notNull().default(1),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date',
    }).defaultNow(),
    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    }).defaultNow(),
  },
  (table) => [
    check('art_style_default_check', sql`${table.isDefault} IN (0, 1)`),
    check('art_style_active_check', sql`${table.isActive} IN (0, 1)`),
    // At most one record where default = 1
    uniqueIndex('art_style_single_default_idx')
      .on(table.isDefault)
      .where(sql`${table.isDefault} = 1`),
    index('art_style_value_idx').on(table.value),
  ]
)

export const artStyleObject = {
  id: artStylesTable.id,
  value: artStylesTable.value,
  label: artStylesTable.label,
  description: artStylesTable.description,
  isDefault: artStylesTable.isDefault,
  isActive: artStylesTable.isActive,
};

export const artStyles = pgMaterializedView('active_art_styles').as((qb) => {
  return qb
    .select(artStyleObject)
    .from(artStylesTable)
    .where(eq(artStylesTable.isActive, 1));
});
