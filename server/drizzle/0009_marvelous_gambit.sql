ALTER TABLE "pet_match" ADD COLUMN "imageSimilarity" double precision NOT NULL;--> statement-breakpoint
ALTER TABLE "pet_match" ADD COLUMN "matchedAttributes" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "pet_alert_pulse_id_unique" ON "pet_alert" USING btree ("pulseId");