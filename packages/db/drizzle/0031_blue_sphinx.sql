DROP MATERIALIZED VIEW "public"."all_games";--> statement-breakpoint
ALTER TABLE "game" ADD COLUMN "steam_wishlist" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "game" ADD COLUMN "epic_wishlist" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "game" ADD COLUMN "nintendo_wishlist" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "game" ADD COLUMN "xbox_wishlist" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "game" ADD COLUMN "humble_bundle_wishlist" boolean DEFAULT false;--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."all_games" AS (select "id", "igdb_id", "name", "image_url", "ai_image_url", "ai_prompt", "image_gen", "clue", "artworks", "keywords", "franchises", "collections", "game_engines", "game_modes", "genres", "involved_companies", "platforms", "player_perspectives", "release_dates", "themes", "first_release_date", "summary", "storyline", "steam", "epic", "gog", "nintendo", "amazon", "microsoft", "xbox", "steam_demo", "epic_demo", "nintendo_demo", "hidden", "steam_wishlist", "epic_wishlist", "nintendo_wishlist", "xbox_wishlist", "humble_bundle_wishlist", "created_at" from "game" order by "game"."name");