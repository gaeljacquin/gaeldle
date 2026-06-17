import { sql, eq } from 'drizzle-orm';
import {
  pgTable,
  serial,
  timestamp,
  integer,
  pgMaterializedView,
  index,
  text,
  check,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const artStylesTable = pgTable(
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
  ],
);

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

export const artStyleSelectSchema = createSelectSchema(artStyles);

export const artStyleValues = pgMaterializedView('active_art_style_values').as(
  (qb) => {
    return qb
      .select({
        value: artStyleObject.value,
      })
      .from(artStylesTable)
      .where(eq(artStylesTable.isActive, 1));
  },
);

export const artStyleValueSelectSchema = createSelectSchema(artStyleValues);

export type ArtStyle = typeof artStyles.$inferSelect;
export type ArtStyleValue = z.infer<typeof artStyleSelectSchema>['value'];
