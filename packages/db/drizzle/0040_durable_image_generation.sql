ALTER TABLE "single_image_gen_job" ADD COLUMN "batch_id" varchar(36);--> statement-breakpoint
ALTER TABLE "single_image_gen_job" ADD COLUMN "input" jsonb;--> statement-breakpoint
CREATE TABLE "image_gen_batch" (
  "batch_id" varchar(36) PRIMARY KEY NOT NULL,
  "actor_id" varchar(255) NOT NULL,
  "params" jsonb NOT NULL,
  "status" varchar(16) DEFAULT 'pending' NOT NULL,
  "total" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone
);--> statement-breakpoint
CREATE INDEX "image_gen_batch_actor_status_idx" ON "image_gen_batch" USING btree ("actor_id", "status");--> statement-breakpoint
CREATE INDEX "single_image_gen_job_batch_idx" ON "single_image_gen_job" USING btree ("batch_id");
