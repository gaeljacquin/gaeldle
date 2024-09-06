-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE IF NOT EXISTS "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" varchar(50) NOT NULL,
	"label" varchar,
	"description" varchar,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" varchar(50) NOT NULL,
	"label" varchar,
	"created_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "levels" (
	"id" serial PRIMARY KEY NOT NULL,
	"level" varchar(50) NOT NULL,
	"label" varchar,
	"created_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
	"class_names" text DEFAULT 'bg-gael-green hover:bg-gael-green' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "modes" (
	"id" serial PRIMARY KEY NOT NULL,
	"mode" varchar(50) NOT NULL,
	"label" varchar,
	"active" boolean DEFAULT false NOT NULL,
	"lives" integer DEFAULT 1 NOT NULL,
	"description" varchar,
	"created_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
	"level_id" integer NOT NULL,
	"pixelation" integer DEFAULT 10 NOT NULL,
	"pixelation_step" integer DEFAULT 4 NOT NULL,
	"category_id" integer,
	"hidden" boolean DEFAULT false NOT NULL,
	"ordinal" integer DEFAULT 1 NOT NULL,
	"isNew" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"igdb_id" integer NOT NULL,
	"steam_id" integer,
	"name" varchar(255) NOT NULL,
	"info" jsonb,
	"created_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
	"image_url" varchar,
	CONSTRAINT "games_igdb_key" UNIQUE("igdb_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gotd" (
	"id" serial PRIMARY KEY NOT NULL,
	"igdb_id" integer,
	"created_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
	"mode_id" integer NOT NULL,
	"scheduled" timestamp(6) with time zone DEFAULT (timezone('EST'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_stats" (
	"Id" serial PRIMARY KEY NOT NULL,
	"gotd_id" integer NOT NULL,
	"attempts" integer NOT NULL,
	"found" boolean DEFAULT false NOT NULL,
	"user_id" integer,
	"mode_id" integer NOT NULL,
	"info" jsonb,
	"created_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
	"real" boolean DEFAULT true NOT NULL,
	"guesses" jsonb[]
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unlimited_stats" (
	"Id" serial PRIMARY KEY NOT NULL,
	"igdb_id" integer NOT NULL,
	"attempts" integer NOT NULL,
	"found" boolean DEFAULT false NOT NULL,
	"user_id" integer,
	"mode_id" integer NOT NULL,
	"info" jsonb,
	"created_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
	"real" boolean DEFAULT true NOT NULL,
	"guesses" jsonb[]
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(255) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"role_id" integer NOT NULL,
	"profile_picture" text,
	"password" varchar(255) NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "modes" ADD CONSTRAINT "modes_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "public"."levels"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "modes" ADD CONSTRAINT "modes_category_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gotd" ADD CONSTRAINT "gotd_mode_id_fkey" FOREIGN KEY ("mode_id") REFERENCES "public"."modes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gotd" ADD CONSTRAINT "gotd_igdb_fk" FOREIGN KEY ("igdb_id") REFERENCES "public"."games"("igdb_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_gotd_fk" FOREIGN KEY ("gotd_id") REFERENCES "public"."gotd"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_mode_id_fkey" FOREIGN KEY ("mode_id") REFERENCES "public"."modes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unlimited_stats" ADD CONSTRAINT "unlimited_stats_igdb_fk" FOREIGN KEY ("igdb_id") REFERENCES "public"."games"("igdb_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unlimited_stats" ADD CONSTRAINT "unlimited_stats_mode_id_fkey" FOREIGN KEY ("mode_id") REFERENCES "public"."modes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unlimited_stats" ADD CONSTRAINT "unlimited_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_role_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "categories_unique_category" ON "categories" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "roles_unique_role" ON "roles" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "levels_unique_level" ON "levels" USING btree ("level");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "modes_unique_mode" ON "modes" USING btree ("mode");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users" USING btree ("username");
*/