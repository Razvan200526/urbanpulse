ALTER TABLE "pet_match" ADD COLUMN IF NOT EXISTS "imageSimilarity" double precision NOT NULL;--> statement-breakpoint
ALTER TABLE "pet_match" ADD COLUMN IF NOT EXISTS "matchedAttributes" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pet_alert_pulse_id_unique" ON "pet_alert" USING btree ("pulseId");