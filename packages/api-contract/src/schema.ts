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

// ─── Bulk Image Job ────────────────────────────────────────────────────────────

export const bulkImageGenJobs = pgTable('bulk_image_gen_job', {
  id: serial('id').primaryKey(),
  jobId: varchar('job_id').unique().notNull(),
  status: varchar('status').notNull(), // 'pending'|'running'|'completed'|'failed'
  total: integer('total').notNull(),
  processed: integer('processed').notNull().default(0),
  succeeded: integer('succeeded').notNull().default(0),
  failed: integer('failed').notNull().default(0),
  failures: json('failures').$type<Array<{ igdbId: number; gameName: string; error: string }>>(),
  params: json('params')
    .notNull()
    .$type<{
      numGames: number;
      imageStyle: string;
      includeStoryline: boolean;
      includeGenres: boolean;
      includeThemes: boolean;
    }>(),
  startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }),
  completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
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
  imageStyle: z.string(),
  includeStoryline: z.boolean(),
  includeGenres: z.boolean(),
  includeThemes: z.boolean(),
});

export const BulkJobStatusEnum = z.enum(['pending', 'running', 'completed', 'failed']);

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
