CREATE TABLE "art_style" (
	"id" serial PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"label" text NOT NULL,
	"description" text NOT NULL,
	"is_default" integer DEFAULT 0 NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "art_style_value_unique" UNIQUE("value"),
	CONSTRAINT "art_style_default_check" CHECK ("art_style"."is_default" IN (0, 1)),
	CONSTRAINT "art_style_active_check" CHECK ("art_style"."is_active" IN (0, 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "art_style_single_default_idx" ON "art_style" USING btree ("is_default") WHERE "art_style"."is_default" = 1;