ALTER TABLE "game_mode" ALTER COLUMN "level" SET NOT NULL;
ALTER TABLE "game_mode" ALTER COLUMN "description" SET DEFAULT 'TBC';--> statement-breakpoint
ALTER TABLE "game_mode" ALTER COLUMN "description" SET NOT NULL;
