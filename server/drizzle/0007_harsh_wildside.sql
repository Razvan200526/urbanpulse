ALTER TABLE "pulse" ADD COLUMN "imageUrls" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "imageUrls" text[] DEFAULT '{}'::text[] NOT NULL;