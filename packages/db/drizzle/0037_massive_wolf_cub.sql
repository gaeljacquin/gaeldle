CREATE TABLE "single_image_gen_job" (
	"job_id" varchar(36) PRIMARY KEY NOT NULL,
	"actor_id" varchar(255) NOT NULL,
	"igdb_id" integer NOT NULL,
	"art_style" varchar(255),
	"provider" varchar(255) NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"sqs_message_id" varchar(255),
	"error" text,
	"result_url" varchar(2048),
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "single_image_gen_job_actor_status_idx" ON "single_image_gen_job" USING btree ("actor_id","status");--> statement-breakpoint
CREATE INDEX "single_image_gen_job_igdb_idx" ON "single_image_gen_job" USING btree ("igdb_id");