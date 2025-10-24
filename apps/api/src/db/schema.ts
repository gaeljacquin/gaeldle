import {
  pgTable,
  serial,
  varchar,
  boolean,
  timestamp,
  integer,
  json,
  // unique,
  text,
  pgEnum,
} from 'drizzle-orm/pg-core';
// import { relations } from 'drizzle-orm';
// import { sql } from 'drizzle-orm';

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

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  displayName: text('display_name'),
  theme: themeEnum('theme').default('cream'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});
