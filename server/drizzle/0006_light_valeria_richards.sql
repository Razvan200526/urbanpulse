CREATE EXTENSION IF NOT EXISTS vector;

CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
ALTER TABLE "pet_alert" ADD COLUMN "imageEmbedding" vector(512);--> statement-breakpoint
ALTER TABLE "pet_alert" ADD COLUMN "embeddingModel" text;--> statement-breakpoint
ALTER TABLE "pet_alert" ADD COLUMN "embeddingStatus" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "pet_alert" ADD COLUMN "embeddingUpdatedAt" timestamp;--> statement-breakpoint
CREATE INDEX "pet_alert_image_embedding_cosine_idx" ON "pet_alert" USING hnsw ("imageEmbedding" vector_cosine_ops);
