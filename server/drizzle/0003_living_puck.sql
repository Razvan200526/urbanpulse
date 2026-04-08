ALTER TABLE "resources" ADD COLUMN "location" geometry(point);--> statement-breakpoint
UPDATE "resources" SET "location" = ST_SetSRID(ST_MakePoint(26.1025, 44.4268), 4326) WHERE "location" IS NULL;--> statement-breakpoint
ALTER TABLE "resources" ALTER COLUMN "location" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "locationLabel" text;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "resourceType" text DEFAULT 'Item' NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" ALTER COLUMN "resourceType" DROP DEFAULT;--> statement-breakpoint
CREATE INDEX "resource_spatial_index" ON "resources" USING gist ("location");
