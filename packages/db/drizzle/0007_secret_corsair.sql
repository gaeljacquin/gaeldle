DROP MATERIALIZED VIEW "public"."all_games_with_artwork";--> statement-breakpoint
DROP MATERIALIZED VIEW "public"."all_games_with_first_release_date";--> statement-breakpoint
DROP MATERIALIZED VIEW "public"."all_games";--> statement-breakpoint
ALTER TABLE "game" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "game" ADD COLUMN "storyline" text;--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."all_games" AS (select "id", "igdb_id", "name", "image_url", "artworks", "keywords", "franchises", "game_engines", "game_modes", "genres", "involved_companies", "platforms", "player_perspectives", "release_dates", "themes", "first_release_date", "ai_image_url", "ai_prompt", "summary", "storyline" from "game" order by "game"."name");
