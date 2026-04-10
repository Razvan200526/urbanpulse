UPDATE "pet_alert"
SET
  "imageEmbedding" = NULL,
  "embeddingModel" = NULL,
  "embeddingStatus" = 'pending',
  "embeddingUpdatedAt" = NULL
WHERE "imageEmbedding" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "pet_alert" ALTER COLUMN "imageEmbedding" SET DATA TYPE vector(768);--> statement-breakpoint
ALTER TABLE "pet_alert" ADD COLUMN "alertType" text;--> statement-breakpoint
UPDATE "pet_alert"
SET "alertType" = 'found'
WHERE "id" IN (SELECT "foundAlertId" FROM "pet_match");--> statement-breakpoint
UPDATE "pet_alert"
SET "alertType" = 'lost'
WHERE "alertType" IS NULL
  AND "id" IN (SELECT "lostAlertId" FROM "pet_match");--> statement-breakpoint
UPDATE "pet_alert"
SET "alertType" = 'lost'
WHERE "alertType" IS NULL;--> statement-breakpoint
ALTER TABLE "pet_alert" ALTER COLUMN "alertType" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "pet_match_lost_found_unique" ON "pet_match" USING btree ("lostAlertId","foundAlertId");
