ALTER TABLE "user" ADD COLUMN "banned" boolean DEFAULT false;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banReason" text;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banExpires" timestamp;
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "impersonatedBy" text;
--> statement-breakpoint
ALTER TABLE "pulse" ADD COLUMN "mergedIntoPulseId" uuid;
--> statement-breakpoint
ALTER TABLE "pulse" ADD COLUMN "moderationNote" text;
--> statement-breakpoint
ALTER TABLE "pulse" ALTER COLUMN "title" TYPE varchar(100);
