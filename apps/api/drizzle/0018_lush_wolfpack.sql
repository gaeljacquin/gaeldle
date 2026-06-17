DROP MATERIALIZED VIEW "public"."active_game_modes";--> statement-breakpoint
ALTER TABLE "game_mode" RENAME COLUMN "name" TO "title";--> statement-breakpoint
ALTER TABLE "game_mode" RENAME COLUMN "difficulty" TO "level";--> statement-breakpoint
ALTER TABLE "game_mode" DROP COLUMN "gradient";--> statement-breakpoint
ALTER TABLE "game_mode" ADD CONSTRAINT "game_mode_level_check" CHECK ("game_mode"."level" IN ('easy', 'medium', 'hard'));--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."active_game_modes" AS (select "id", "slug", "title", "description", "level", "ordinal", "is_active", "is_cover_art" from "game_mode" where "game_mode"."is_active" = 1 order by "game_mode"."ordinal");
