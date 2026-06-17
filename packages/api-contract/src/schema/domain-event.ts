import {
  pgTable,
  serial,
  varchar,
  timestamp,
  json,
  index,
} from 'drizzle-orm/pg-core';

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
