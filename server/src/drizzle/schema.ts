import {
  pgTable,
  uniqueIndex,
  serial,
  varchar,
  boolean,
  timestamp,
  text,
  foreignKey,
  integer,
  unique,
  jsonb,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const categories = pgTable(
  'categories',
  {
    id: serial('id').primaryKey().notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    label: varchar('label'),
    description: varchar('description'),
    active: boolean('active').default(false).notNull(),
    createdAt: timestamp('created_at', {
      precision: 6,
      withTimezone: true,
      mode: 'string',
    }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at', {
      precision: 6,
      withTimezone: true,
      mode: 'string',
    }).default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => {
    return {
      uniqueCategory: uniqueIndex('categories_unique_category').using(
        'btree',
        table.category.asc().nullsLast(),
      ),
    };
  },
);

export const roles = pgTable(
  'roles',
  {
    id: serial('id').primaryKey().notNull(),
    role: varchar('role', { length: 50 }).notNull(),
    label: varchar('label'),
    createdAt: timestamp('created_at', {
      precision: 6,
      withTimezone: true,
      mode: 'string',
    }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at', {
      precision: 6,
      withTimezone: true,
      mode: 'string',
    }).default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => {
    return {
      uniqueRole: uniqueIndex('roles_unique_role').using(
        'btree',
        table.role.asc().nullsLast(),
      ),
    };
  },
);

export const levels = pgTable(
  'levels',
  {
    id: serial('id').primaryKey().notNull(),
    level: varchar('level', { length: 50 }).notNull(),
    label: varchar('label'),
    createdAt: timestamp('created_at', {
      precision: 6,
      withTimezone: true,
      mode: 'string',
    }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at', {
      precision: 6,
      withTimezone: true,
      mode: 'string',
    }).default(sql`CURRENT_TIMESTAMP`),
    classNames: text('class_names')
      .default('bg-gael-green hover:bg-gael-green')
      .notNull(),
  },
  (table) => {
    return {
      uniqueLevel: uniqueIndex('levels_unique_level').using(
        'btree',
        table.level.asc().nullsLast(),
      ),
    };
  },
);

export const modes = pgTable(
  'modes',
  {
    id: serial('id').primaryKey().notNull(),
    mode: varchar('mode', { length: 50 }).notNull(),
    label: varchar('label'),
    active: boolean('active').default(false).notNull(),
    lives: integer('lives').default(1).notNull(),
    description: varchar('description'),
    createdAt: timestamp('created_at', {
      precision: 6,
      withTimezone: true,
      mode: 'string',
    }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at', {
      precision: 6,
      withTimezone: true,
      mode: 'string',
    }).default(sql`CURRENT_TIMESTAMP`),
    levelId: integer('level_id').notNull(),
    pixelation: integer('pixelation').default(10).notNull(),
    pixelationStep: integer('pixelation_step').default(4).notNull(),
    categoryId: integer('category_id'),
    hidden: boolean('hidden').default(false).notNull(),
    ordinal: integer('ordinal').default(1).notNull(),
    isNew: boolean('isNew').default(true).notNull(),
  },
  (table) => {
    return {
      uniqueMode: uniqueIndex('modes_unique_mode').using(
        'btree',
        table.mode.asc().nullsLast(),
      ),
      modesLevelIdFkey: foreignKey({
        columns: [table.levelId],
        foreignColumns: [levels.id],
        name: 'modes_level_id_fkey',
      }),
      modesCategoryFkey: foreignKey({
        columns: [table.categoryId],
        foreignColumns: [categories.id],
        name: 'modes_category_fkey',
      }),
    };
  },
);

export const games = pgTable(
  'games',
  {
    id: serial('id').primaryKey().notNull(),
    igdbId: integer('igdb_id').notNull(),
    steamId: integer('steam_id'),
    name: varchar('name', { length: 255 }).notNull(),
    info: jsonb('info'),
    createdAt: timestamp('created_at', {
      precision: 6,
      withTimezone: true,
      mode: 'string',
    }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at', {
      precision: 6,
      withTimezone: true,
      mode: 'string',
    }).default(sql`CURRENT_TIMESTAMP`),
    imageUrl: varchar('image_url'),
  },
  (table) => {
    return {
      gamesIgdbKey: unique('games_igdb_key').on(table.igdbId),
    };
  },
);

export const gotd = pgTable(
  'gotd',
  {
    id: serial('id').primaryKey().notNull(),
    igdbId: integer('igdb_id'),
    createdAt: timestamp('created_at', {
      precision: 6,
      withTimezone: true,
      mode: 'string',
    }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at', {
      precision: 6,
      withTimezone: true,
      mode: 'string',
    }).default(sql`CURRENT_TIMESTAMP`),
    modeId: integer('mode_id').notNull(),
    scheduled: timestamp('scheduled', {
      precision: 6,
      withTimezone: true,
      mode: 'string',
    }).default(sql`CURRENT_TIMESTAMP AT TIME ZONE 'EST'`),
  },
  (table) => {
    return {
      gotdModeIdFkey: foreignKey({
        columns: [table.modeId],
        foreignColumns: [modes.id],
        name: 'gotd_mode_id_fkey',
      }),
      gotdIgdbFk: foreignKey({
        columns: [table.igdbId],
        foreignColumns: [games.igdbId],
        name: 'gotd_igdb_fk',
      }),
    };
  },
);

export const dailyStats = pgTable(
  'daily_stats',
  {
    id: serial('Id').primaryKey().notNull(),
    gotdId: integer('gotd_id').notNull(),
    attempts: integer('attempts').notNull(),
    found: boolean('found').default(false).notNull(),
    userId: integer('user_id'),
    modeId: integer('mode_id').notNull(),
    info: jsonb('info'),
    createdAt: timestamp('created_at', {
      precision: 6,
      withTimezone: true,
      mode: 'string',
    }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at', {
      precision: 6,
      withTimezone: true,
      mode: 'string',
    }).default(sql`CURRENT_TIMESTAMP`),
    real: boolean('real').default(true).notNull(),
    guesses: jsonb('guesses').array(),
  },
  (table) => {
    return {
      dailyStatsGotdFk: foreignKey({
        columns: [table.gotdId],
        foreignColumns: [gotd.id],
        name: 'daily_stats_gotd_fk',
      }),
      dailyStatsModeIdFkey: foreignKey({
        columns: [table.modeId],
        foreignColumns: [modes.id],
        name: 'daily_stats_mode_id_fkey',
      }),
      dailyStatsUserIdFkey: foreignKey({
        columns: [table.userId],
        foreignColumns: [users.id],
        name: 'daily_stats_user_id_fkey',
      }),
    };
  },
);

export const unlimitedStats = pgTable(
  'unlimited_stats',
  {
    id: serial('Id').primaryKey().notNull(),
    igdbId: integer('igdb_id').notNull(),
    attempts: integer('attempts').notNull(),
    found: boolean('found').default(false).notNull(),
    userId: integer('user_id'),
    modeId: integer('mode_id').notNull(),
    info: jsonb('info'),
    createdAt: timestamp('created_at', {
      precision: 6,
      withTimezone: true,
      mode: 'string',
    }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at', {
      precision: 6,
      withTimezone: true,
      mode: 'string',
    }).default(sql`CURRENT_TIMESTAMP`),
    real: boolean('real').default(true).notNull(),
    guesses: jsonb('guesses').array(),
  },
  (table) => {
    return {
      unlimitedStatsIgdbFk: foreignKey({
        columns: [table.igdbId],
        foreignColumns: [games.igdbId],
        name: 'unlimited_stats_igdb_fk',
      }),
      unlimitedStatsModeIdFkey: foreignKey({
        columns: [table.modeId],
        foreignColumns: [modes.id],
        name: 'unlimited_stats_mode_id_fkey',
      }),
      unlimitedStatsUserIdFkey: foreignKey({
        columns: [table.userId],
        foreignColumns: [users.id],
        name: 'unlimited_stats_user_id_fkey',
      }),
    };
  },
);

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey().notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    username: varchar('username', { length: 255 }).notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    roleId: integer('role_id').notNull(),
    profilePicture: text('profile_picture'),
    password: varchar('password', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', {
      precision: 6,
      withTimezone: true,
      mode: 'string',
    }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at', {
      precision: 6,
      withTimezone: true,
      mode: 'string',
    }).default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => {
    return {
      emailKey: uniqueIndex('users_email_key').using(
        'btree',
        table.email.asc().nullsLast(),
      ),
      usernameKey: uniqueIndex('users_username_key').using(
        'btree',
        table.username.asc().nullsLast(),
      ),
      usersRoleFkey: foreignKey({
        columns: [table.roleId],
        foreignColumns: [roles.id],
        name: 'users_role_fkey',
      }),
    };
  },
);
