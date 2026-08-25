CREATE TABLE "game_mode" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"difficulty" text,
	"gradient" text,
	"ordinal" serial NOT NULL,
	"is_active" integer DEFAULT 0 NOT NULL,
	"is_cover_art" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "game_mode_slug_unique" UNIQUE("slug"),
	CONSTRAINT "game_mode_ordinal_unique" UNIQUE("ordinal"),
	CONSTRAINT "game_mode_active_check" CHECK ("game_mode"."is_active" IN (0, 1)),
	CONSTRAINT "game_mode_cover_art_check" CHECK ("game_mode"."is_cover_art" IN (0, 1))
);
--> statement-breakpoint
CREATE INDEX "game_mode_slug_idx" ON "game_mode" USING btree ("slug");--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."active_art_style_values" AS (select "value" from "art_style" where "art_style"."is_active" = 1);--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."active_game_modes" AS (select "id", "slug", "name", "description", "difficulty", "gradient", "ordinal", "is_active", "is_cover_art" from "game_mode" where "game_mode"."is_active" = 1 order by "game_mode"."ordinal");