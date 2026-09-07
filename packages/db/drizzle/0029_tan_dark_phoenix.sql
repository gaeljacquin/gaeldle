DROP MATERIALIZED VIEW "public"."all_games";--> statement-breakpoint
ALTER TABLE "game" ADD COLUMN "steam" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "game" ADD COLUMN "epic" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "game" ADD COLUMN "gog" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "game" ADD COLUMN "nintendo" boolean DEFAULT false;--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."all_games" AS (select "id", "igdb_id", "name", "image_url", "ai_image_url", "ai_prompt", "image_gen", "clue", "artworks", "keywords", "franchises", "collections", "game_engines", "game_modes", "genres", "involved_companies", "platforms", "player_perspectives", "release_dates", "themes", "first_release_date", "summary", "storyline", "steam", "epic", "gog", "nintendo", "created_at" from "game" order by "game"."name");