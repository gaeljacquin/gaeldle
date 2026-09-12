UPDATE "game" SET
  "steam" = COALESCE("steam", false),
  "epic" = COALESCE("epic", false),
  "gog" = COALESCE("gog", false),
  "nintendo" = COALESCE("nintendo", false),
  "amazon" = COALESCE("amazon", false),
  "microsoft" = COALESCE("microsoft", false),
  "xbox" = COALESCE("xbox", false),
  "steam_demo" = COALESCE("steam_demo", false),
  "epic_demo" = COALESCE("epic_demo", false),
  "nintendo_demo" = COALESCE("nintendo_demo", false),
  "hidden" = COALESCE("hidden", false),
  "steam_wishlist" = COALESCE("steam_wishlist", false),
  "epic_wishlist" = COALESCE("epic_wishlist", false),
  "nintendo_wishlist" = COALESCE("nintendo_wishlist", false),
  "xbox_wishlist" = COALESCE("xbox_wishlist", false),
  "humble_bundle_wishlist" = COALESCE("humble_bundle_wishlist", false);--> statement-breakpoint
ALTER TABLE "game" ALTER COLUMN "steam" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "game" ALTER COLUMN "epic" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "game" ALTER COLUMN "gog" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "game" ALTER COLUMN "nintendo" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "game" ALTER COLUMN "amazon" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "game" ALTER COLUMN "microsoft" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "game" ALTER COLUMN "xbox" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "game" ALTER COLUMN "steam_demo" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "game" ALTER COLUMN "epic_demo" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "game" ALTER COLUMN "nintendo_demo" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "game" ALTER COLUMN "hidden" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "game" ALTER COLUMN "steam_wishlist" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "game" ALTER COLUMN "epic_wishlist" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "game" ALTER COLUMN "nintendo_wishlist" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "game" ALTER COLUMN "xbox_wishlist" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "game" ALTER COLUMN "humble_bundle_wishlist" SET NOT NULL;