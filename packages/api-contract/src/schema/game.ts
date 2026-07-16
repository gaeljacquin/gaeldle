import { InferInsertModel, sql } from 'drizzle-orm';
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
    })
      .defaultNow()
      .$onUpdate(() => new Date()),
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
    clue: json('clue').$type<{
      clue: string;
      prompt: string;
      provider: string;
      model: string;
      createdAt: string;
    }>(),
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
  clue: games.clue,
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
  createdAt: games.createdAt,
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

export type GameInsert = InferInsertModel<typeof games>;
export type Game = typeof allGames.$inferSelect;

export const queriedGames = pgMaterializedView('queried_games', {
  igdbId: integer('igdb_id'),
  name: varchar('name', { length: 255 }),
  gameInfo: json('game_info').$type<GameInsert>(),
}).as(
  sql`SELECT DISTINCT ON ((payload->>'igdbId')::integer)
    (payload->>'igdbId')::integer AS igdb_id,
    payload->>'gameName' AS name,
    payload->'gameInfo' AS game_info
  FROM domain_event
  WHERE event_type = 'game.queried'
    AND (payload->>'alreadyInDb')::boolean = false
    AND (payload->>'found')::boolean = true
    AND NOT EXISTS (
      SELECT 1 FROM game WHERE game.igdb_id = (payload->>'igdbId')::integer
    )
  ORDER BY (payload->>'igdbId')::integer, occurred_at DESC`,
);

export type QueriedGame = typeof queriedGames.$inferSelect;

export const gamesClueHistory = pgMaterializedView('games_clue_history', {
  id: integer('id'),
  gameId: integer('game_id'),
  igdbId: integer('igdb_id'),
  name: varchar('name', { length: 255 }),
  clue: text('clue'),
  prompt: text('prompt'),
  provider: varchar('provider', { length: 255 }),
  model: varchar('model', { length: 255 }),
  occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' }),
}).as(
  sql`SELECT
    de.id AS id,
    (de.payload->>'gameId')::integer AS game_id,
    (de.payload->>'igdbId')::integer AS igdb_id,
    g.name AS name,
    de.payload->>'clue' AS clue,
    de.payload->>'prompt' AS prompt,
    de.payload->>'provider' AS provider,
    de.payload->>'model' AS model,
    de.occurred_at AS occurred_at
  FROM domain_event de
  JOIN game g ON g.id = (de.payload->>'gameId')::integer
  WHERE de.event_type IN ('clue.generated', 'clue.restored')
  ORDER BY de.occurred_at DESC`,
);

export const GameClueHistorySchema = createSelectSchema(gamesClueHistory);
export type GameClueHistory = typeof gamesClueHistory.$inferSelect;
