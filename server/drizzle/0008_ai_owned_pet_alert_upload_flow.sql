ALTER TABLE "pet_match" ADD COLUMN "imageSimilarity" double precision;
ALTER TABLE "pet_match" ADD COLUMN "matchedAttributes" jsonb DEFAULT '[]'::jsonb;
UPDATE "pet_match" SET "imageSimilarity" = "confidenceScore" WHERE "imageSimilarity" IS NULL;
UPDATE "pet_match" SET "matchedAttributes" = '[]'::jsonb WHERE "matchedAttributes" IS NULL;
ALTER TABLE "pet_match" ALTER COLUMN "imageSimilarity" SET NOT NULL;
ALTER TABLE "pet_match" ALTER COLUMN "matchedAttributes" SET NOT NULL;
CREATE UNIQUE INDEX "pet_alert_pulse_id_unique" ON "pet_alert" USING btree ("pulseId");
