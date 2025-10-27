import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  json,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const themeEnum = pgEnum('theme', ['cream', 'pink', 'blue', 'green']);

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
  game_engines: json('game_engines'),
  game_modes: json('game_modes'),
  genres: json('genres'),
  involved_companies: json('involved_companies'),
  platforms: json('platforms'),
  player_perspectives: json('player_perspectives'),
  release_dates: json('release_dates'),
  themes: json('themes'),
  first_release_date: integer('first_release_date'),
});
