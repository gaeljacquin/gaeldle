import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  json,
  pgMaterializedView,
  index,
} from 'drizzle-orm/pg-core';
import { isNotNull } from 'drizzle-orm';

export const games = pgTable('game', {
  id: serial('id').primaryKey(),
  igdbId: integer('igdb_id').notNull().unique('games_igdb_key'),
  name: varchar('name', { length: 255 }).notNull(),
  info: json('info'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  imageUrl: varchar('image_url'),
  artworks: json('artworks'),
  keywords: json('keywords'),
  franchises: json('franchises'),
  gameEngines: json('game_engines'),
  gameModes: json('game_modes'),
  genres: json('genres'),
  involvedCompanies: json('involved_companies'),
  platforms: json('platforms'),
  playerPerspectives: json('player_perspectives'),
  releaseDates: json('release_dates'),
  themes: json('themes'),
  firstReleaseDate: integer('first_release_date'),
  aiImageUrl: varchar('ai_image_url'),
  aiPrompt: varchar('ai_prompt'),
}, (table) => ({
  nameIdx: index('game_name_idx').on(table.name),
}));

const gameObject = {
  id: games.id,
  igdbId: games.igdbId,
  name: games.name,
  imageUrl: games.imageUrl,
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
  aiImageUrl: games.aiImageUrl,
  aiPrompt: games.aiPrompt,
};

export const allGames = pgMaterializedView('all_games').as((qb) => {
  return qb
    .select(gameObject)
    .from(games)
    .orderBy(games.name)
  ;
});

export const allGamesWithArtwork = pgMaterializedView('all_games_with_artwork').as((qb) => {
  return qb
    .select(gameObject)
    .from(games)
    .where(isNotNull(games.artworks))
    .orderBy(games.name)
  ;
});

export const allGamesWithFirstReleaseDate = pgMaterializedView('all_games_with_first_release_date').as((qb) => {
  return qb
    .select(gameObject)
    .from(games)
    .where(isNotNull(games.firstReleaseDate))
    .orderBy(games.name)
  ;
});

export type Game = typeof allGames.$inferSelect;
