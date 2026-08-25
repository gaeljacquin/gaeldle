DROP MATERIALIZED VIEW "public"."active_game_modes";--> statement-breakpoint
ALTER TABLE "game_mode" ADD COLUMN "gradient" text DEFAULT 'linear-gradient(135deg, hsl(215 19% 35%) 0%, hsl(215 28% 17%) 100%)' NOT NULL;--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."active_game_modes" AS (select "slug", "title", "description", "level", "max_attempts", "gradient", "ordinal", "is_active", "is_cover_art" from "game_mode" where "game_mode"."is_active" = 1 order by "game_mode"."ordinal");
