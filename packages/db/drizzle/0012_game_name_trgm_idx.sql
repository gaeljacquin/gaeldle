CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
-- Uses GIN index with gin_trgm_ops for trigram-based ILIKE searches on game.name
-- Plain CREATE INDEX (not CONCURRENTLY) so this can run inside a Drizzle transaction
CREATE INDEX "game_name_trgm_idx" ON "game" USING GIN ("name" gin_trgm_ops);
