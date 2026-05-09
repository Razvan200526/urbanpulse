CREATE TABLE "lost_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"documentType" text NOT NULL,
	"extractedName" text,
	"extractedFirstName" text,
	"extractedBirthYear" integer,
	"extractedCity" text,
	"originalImageKey" text NOT NULL,
	"blurredImageUrl" text NOT NULL,
	"embeddingVector" vector(768),
	"embeddingModel" text,
	"embeddingStatus" text DEFAULT 'pending' NOT NULL,
	"embeddingUpdatedAt" timestamp,
	"sensitiveRegions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lost_document_match" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"documentId" uuid NOT NULL,
	"potentialOwnerId" text NOT NULL,
	"similarityScore" double precision NOT NULL,
	"compositeScore" double precision NOT NULL,
	"nameMatch" boolean DEFAULT false,
	"birthYearMatch" boolean DEFAULT false,
	"cityMatch" boolean DEFAULT false,
	"notified" boolean DEFAULT false,
	"notifiedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "firstName" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "lastName" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "birthYear" integer;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "homeCity" text;--> statement-breakpoint
ALTER TABLE "lost_document" ADD CONSTRAINT "lost_document_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lost_document_match" ADD CONSTRAINT "lost_document_match_documentId_lost_document_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."lost_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lost_document_match" ADD CONSTRAINT "lost_document_match_potentialOwnerId_user_id_fk" FOREIGN KEY ("potentialOwnerId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lost_document_user_id_index" ON "lost_document" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "lost_document_embedding_cosine_idx" ON "lost_document" USING hnsw ("embeddingVector" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "lost_document_match_document_id_index" ON "lost_document_match" USING btree ("documentId");--> statement-breakpoint
CREATE INDEX "lost_document_match_owner_id_index" ON "lost_document_match" USING btree ("potentialOwnerId");