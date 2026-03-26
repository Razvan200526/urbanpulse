ALTER TABLE "pulse" RENAME COLUMN "position" TO "location";--> statement-breakpoint
CREATE INDEX "spatial_index" ON "pulse" USING gist ("location");