CREATE TABLE "message_receipt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"messageId" uuid NOT NULL,
	"userId" text NOT NULL,
	"deliveredAt" timestamp,
	"readAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "message_receipt" ADD CONSTRAINT "message_receipt_messageId_message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_receipt" ADD CONSTRAINT "message_receipt_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "message_receipt_message_user_unique" ON "message_receipt" USING btree ("messageId","userId");--> statement-breakpoint
CREATE INDEX "message_receipt_user_message_index" ON "message_receipt" USING btree ("userId","messageId");