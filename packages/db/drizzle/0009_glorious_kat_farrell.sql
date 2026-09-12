CREATE TABLE "bulk_image_gen_job" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" varchar NOT NULL,
	"status" varchar NOT NULL,
	"total" integer NOT NULL,
	"processed" integer DEFAULT 0 NOT NULL,
	"succeeded" integer DEFAULT 0 NOT NULL,
	"failed" integer DEFAULT 0 NOT NULL,
	"failures" json,
	"params" json NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "bulk_image_gen_job_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
DROP MATERIALIZED VIEW "public"."all_games";--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."all_games" AS (select "id", "igdb_id", "name", "info", "image_url", "ai_image_url", "ai_prompt", "artworks", "keywords", "franchises", "game_engines", "game_modes", "genres", "involved_companies", "platforms", "player_perspectives", "release_dates", "themes", "first_release_date", "summary", "storyline" from "game" order by "game"."name");
