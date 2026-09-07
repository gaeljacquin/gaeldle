CREATE TABLE "domain_event" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"actor_id" varchar(255) NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now(),
	"payload" json NOT NULL
);
--> statement-breakpoint
CREATE INDEX "domain_event_type_idx" ON "domain_event" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "domain_event_occurred_idx" ON "domain_event" USING btree ("occurred_at");