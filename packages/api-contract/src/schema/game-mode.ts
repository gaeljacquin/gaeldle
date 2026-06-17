import { sql, eq } from 'drizzle-orm';
import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  check,
  pgMaterializedView,
  index,
  text,
} from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const gameModeTable = pgTable(
  'game_mode',
  {
    id: serial('id').primaryKey(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull().default('TBC'),
    level: text('level').notNull(),
    ordinal: serial('ordinal').unique().notNull(),
    isActive: integer('is_active').notNull().default(0),
    isCoverArt: integer('is_cover_art').notNull().default(0),
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
    check(
      'game_mode_level_check',
      sql`${table.level} IN ('easy', 'medium', 'hard')`,
    ),
    check('game_mode_active_check', sql`${table.isActive} IN (0, 1)`),
    check('game_mode_cover_art_check', sql`${table.isCoverArt} IN (0, 1)`),
    index('game_mode_slug_idx').on(table.slug),
  ],
);

export const gameModeObject = {
  slug: gameModeTable.slug,
  title: gameModeTable.title,
  description: gameModeTable.description,
  level: gameModeTable.level,
  ordinal: gameModeTable.ordinal,
  isActive: gameModeTable.isActive,
  isCoverArt: gameModeTable.isCoverArt,
};

export const gameModes = pgMaterializedView('active_game_modes').as((qb) => {
  return qb
    .select(gameModeObject)
    .from(gameModeTable)
    .where(eq(gameModeTable.isActive, 1))
    .orderBy(gameModeObject.ordinal);
});

export const gameModeSelectSchema = createSelectSchema(gameModes);

export type GameMode = z.infer<typeof gameModeSelectSchema> & {
  gradient: string;
  icon: string;
  href: string;
};
export type GameModeLevel = z.infer<typeof gameModeSelectSchema>['level'];
