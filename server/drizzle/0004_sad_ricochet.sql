CREATE TABLE "resource_review" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transactionId" uuid NOT NULL,
	"resourceId" uuid NOT NULL,
	"reviewerId" text NOT NULL,
	"revieweeId" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "resource_review_transactionId_unique" UNIQUE("transactionId")
);
--> statement-breakpoint
ALTER TABLE "resource_review" ADD CONSTRAINT "resource_review_transactionId_transaction_id_fk" FOREIGN KEY ("transactionId") REFERENCES "public"."transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_review" ADD CONSTRAINT "resource_review_resourceId_resources_id_fk" FOREIGN KEY ("resourceId") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_review" ADD CONSTRAINT "resource_review_reviewerId_user_id_fk" FOREIGN KEY ("reviewerId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_review" ADD CONSTRAINT "resource_review_revieweeId_user_id_fk" FOREIGN KEY ("revieweeId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;