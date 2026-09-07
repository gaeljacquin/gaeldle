DROP MATERIALIZED VIEW "public"."all_games";--> statement-breakpoint
ALTER TABLE "game" ADD COLUMN "amazon" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "game" ADD COLUMN "microsoft" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "game" ADD COLUMN "xbox" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "game" ADD COLUMN "steam_demo" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "game" ADD COLUMN "epic_demo" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "game" ADD COLUMN "nintendo_demo" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "game" ADD COLUMN "hidden" boolean DEFAULT false;--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."all_games" AS (select "id", "igdb_id", "name", "image_url", "ai_image_url", "ai_prompt", "image_gen", "clue", "artworks", "keywords", "franchises", "collections", "game_engines", "game_modes", "genres", "involved_companies", "platforms", "player_perspectives", "release_dates", "themes", "first_release_date", "summary", "storyline", "steam", "epic", "gog", "nintendo", "amazon", "microsoft", "xbox", "steam_demo", "epic_demo", "nintendo_demo", "hidden", "created_at" from "game" order by "game"."name");