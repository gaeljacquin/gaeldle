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
    info: json('info').$type<any>(),
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

const gameObject = {
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
export type Game = typeof allGames.$inferSelect;
