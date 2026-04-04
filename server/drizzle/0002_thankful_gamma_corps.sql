ALTER TABLE "pulse" ADD COLUMN "requestedSkillTags" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "pulse" ADD COLUMN "matchMetadata" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "homeLocation" geometry(point);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "lastKnownLocation" geometry(point);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "lastKnownLocationUpdatedAt" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "heroAlertRadiusMeters" integer DEFAULT 500 NOT NULL;--> statement-breakpoint
CREATE INDEX "user_home_location_spatial_index" ON "user" USING gist ("homeLocation");--> statement-breakpoint
CREATE INDEX "user_last_known_location_spatial_index" ON "user" USING gist ("lastKnownLocation");
