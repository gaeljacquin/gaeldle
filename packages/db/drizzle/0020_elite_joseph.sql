ALTER TABLE "bulk_image_gen_job" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP MATERIALIZED VIEW "public"."active_game_modes";--> statement-breakpoint
DROP TABLE "bulk_image_gen_job" CASCADE;--> statement-breakpoint
ALTER TABLE "game_mode" ALTER COLUMN "description" SET DEFAULT 'TBC';--> statement-breakpoint
ALTER TABLE "game_mode" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "game_mode" ADD COLUMN "max_attempts" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."active_game_modes" AS (select "slug", "title", "description", "level", "ordinal", "is_active", "is_cover_art" from "game_mode" where "game_mode"."is_active" = 1 order by "game_mode"."ordinal");