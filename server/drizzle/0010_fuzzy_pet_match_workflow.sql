ALTER TABLE "pet_match" ADD COLUMN "status" text DEFAULT 'PENDING_REVIEW' NOT NULL;--> statement-breakpoint
ALTER TABLE "pet_match" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
UPDATE "pet_match" SET "updatedAt" = "createdAt";
