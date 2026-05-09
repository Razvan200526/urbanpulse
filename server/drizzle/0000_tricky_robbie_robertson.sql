CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"pulseId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversationId" uuid NOT NULL,
	"userId" text NOT NULL,
	"hiddenAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "incident_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"label" varchar(80) NOT NULL,
	"description" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"isSystem" boolean DEFAULT false NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversationId" uuid NOT NULL,
	"senderId" text NOT NULL,
	"content" text NOT NULL,
	"sentAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_receipt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"messageId" uuid NOT NULL,
	"userId" text NOT NULL,
	"deliveredAt" timestamp,
	"readAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pet_alert" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pulseId" uuid NOT NULL,
	"alertType" text NOT NULL,
	"petType" text NOT NULL,
	"color" text NOT NULL,
	"breed" text,
	"imageUrl" text,
	"aiDescriptor" text,
	"imageEmbedding" vector(768),
	"embeddingModel" text,
	"embeddingStatus" text DEFAULT 'pending' NOT NULL,
	"embeddingUpdatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "pet_match" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lostAlertId" uuid NOT NULL,
	"foundAlertId" uuid NOT NULL,
	"confidenceScore" double precision NOT NULL,
	"imageSimilarity" double precision NOT NULL,
	"matchedAttributes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'PENDING_REVIEW' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pulse" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text DEFAULT 'Emergency' NOT NULL,
	"incidentTypeId" uuid,
	"userId" text NOT NULL,
	"urgency" text NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" text,
	"location" geometry(point) NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"pulseUploadState" text DEFAULT 'pending' NOT NULL,
	"audioUrl" text,
	"imageUrls" text[] DEFAULT '{}'::text[] NOT NULL,
	"requestedSkillTags" text[] DEFAULT '{}'::text[] NOT NULL,
	"matchMetadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"isResolved" boolean DEFAULT false NOT NULL,
	"isVerified" boolean,
	"mergedIntoPulseId" uuid,
	"moderationNote" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pulse_cluster_members" (
	"pulse_id" uuid,
	"cluster_id" uuid
);
--> statement-breakpoint
CREATE TABLE "pulse_clusters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pulse_type" text NOT NULL,
	"center_lat" double precision NOT NULL,
	"center_lng" double precision NOT NULL,
	"radius_meters" integer NOT NULL,
	"report_count" integer DEFAULT 1,
	"confidence_score" double precision DEFAULT 0,
	"status" text DEFAULT 'active',
	"crisis_triggered" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pulse_confirmation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pulseId" uuid NOT NULL,
	"userId" text NOT NULL,
	"confirmedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "response" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pulseId" uuid NOT NULL,
	"responderId" text NOT NULL,
	"status" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiet_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"startTime" time NOT NULL,
	"endTime" time NOT NULL,
	"days" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporterId" text NOT NULL,
	"targetUserId" text,
	"targetPulseId" uuid,
	"reason" text NOT NULL,
	"status" text DEFAULT 'Pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"availability" text NOT NULL,
	"location" geometry(point) NOT NULL,
	"locationLabel" text,
	"resourceType" text NOT NULL,
	"imageUrls" text[] DEFAULT '{}'::text[] NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"impersonatedBy" text,
	"userId" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "skill" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tag" text NOT NULL,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resourceId" uuid NOT NULL,
	"borrowerId" text,
	"lenderId" text,
	"status" text NOT NULL,
	"startAt" timestamp NOT NULL,
	"endAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean NOT NULL,
	"image" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"role" text DEFAULT 'user',
	"bio" text,
	"trustScore" double precision DEFAULT 0,
	"successfulInteractions" integer DEFAULT 0,
	"failedInteractions" integer DEFAULT 0,
	"isVerified" boolean DEFAULT false,
	"rememberMe" boolean DEFAULT false,
	"banned" boolean DEFAULT false,
	"banReason" text,
	"banExpires" timestamp,
	"homeLocation" geometry(point),
	"lastKnownLocation" geometry(point),
	"lastKnownLocationUpdatedAt" timestamp,
	"heroAlertRadiusMeters" integer DEFAULT 500 NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp,
	"updatedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_pulseId_pulse_id_fk" FOREIGN KEY ("pulseId") REFERENCES "public"."pulse"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_member" ADD CONSTRAINT "conversation_member_conversationId_conversation_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_member" ADD CONSTRAINT "conversation_member_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_conversationId_conversation_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_senderId_user_id_fk" FOREIGN KEY ("senderId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_receipt" ADD CONSTRAINT "message_receipt_messageId_message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_receipt" ADD CONSTRAINT "message_receipt_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pet_alert" ADD CONSTRAINT "pet_alert_pulseId_pulse_id_fk" FOREIGN KEY ("pulseId") REFERENCES "public"."pulse"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pet_match" ADD CONSTRAINT "pet_match_lostAlertId_pet_alert_id_fk" FOREIGN KEY ("lostAlertId") REFERENCES "public"."pet_alert"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pet_match" ADD CONSTRAINT "pet_match_foundAlertId_pet_alert_id_fk" FOREIGN KEY ("foundAlertId") REFERENCES "public"."pet_alert"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse" ADD CONSTRAINT "pulse_incidentTypeId_incident_type_id_fk" FOREIGN KEY ("incidentTypeId") REFERENCES "public"."incident_type"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse" ADD CONSTRAINT "pulse_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_cluster_members" ADD CONSTRAINT "pulse_cluster_members_pulse_id_pulse_id_fk" FOREIGN KEY ("pulse_id") REFERENCES "public"."pulse"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_cluster_members" ADD CONSTRAINT "pulse_cluster_members_cluster_id_pulse_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."pulse_clusters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_confirmation" ADD CONSTRAINT "pulse_confirmation_pulseId_pulse_id_fk" FOREIGN KEY ("pulseId") REFERENCES "public"."pulse"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_confirmation" ADD CONSTRAINT "pulse_confirmation_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response" ADD CONSTRAINT "response_pulseId_pulse_id_fk" FOREIGN KEY ("pulseId") REFERENCES "public"."pulse"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response" ADD CONSTRAINT "response_responderId_user_id_fk" FOREIGN KEY ("responderId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiet_hours" ADD CONSTRAINT "quiet_hours_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_reporterId_user_id_fk" FOREIGN KEY ("reporterId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_targetUserId_user_id_fk" FOREIGN KEY ("targetUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_targetPulseId_pulse_id_fk" FOREIGN KEY ("targetPulseId") REFERENCES "public"."pulse"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_review" ADD CONSTRAINT "resource_review_transactionId_transaction_id_fk" FOREIGN KEY ("transactionId") REFERENCES "public"."transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_review" ADD CONSTRAINT "resource_review_resourceId_resources_id_fk" FOREIGN KEY ("resourceId") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_review" ADD CONSTRAINT "resource_review_reviewerId_user_id_fk" FOREIGN KEY ("reviewerId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_review" ADD CONSTRAINT "resource_review_revieweeId_user_id_fk" FOREIGN KEY ("revieweeId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill" ADD CONSTRAINT "skill_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_resourceId_resources_id_fk" FOREIGN KEY ("resourceId") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_borrowerId_user_id_fk" FOREIGN KEY ("borrowerId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_lenderId_user_id_fk" FOREIGN KEY ("lenderId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "incident_type_slug_unique" ON "incident_type" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "message_receipt_message_user_unique" ON "message_receipt" USING btree ("messageId","userId");--> statement-breakpoint
CREATE INDEX "message_receipt_user_message_index" ON "message_receipt" USING btree ("userId","messageId");--> statement-breakpoint
CREATE UNIQUE INDEX "pet_alert_pulse_id_unique" ON "pet_alert" USING btree ("pulseId");--> statement-breakpoint
CREATE INDEX "pet_alert_image_embedding_cosine_idx" ON "pet_alert" USING hnsw ("imageEmbedding" vector_cosine_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "pet_match_lost_found_unique" ON "pet_match" USING btree ("lostAlertId","foundAlertId");--> statement-breakpoint
CREATE INDEX "spatial_index" ON "pulse" USING gist ("location");--> statement-breakpoint
CREATE INDEX "idx_clusters_location" ON "pulse_clusters" USING gist (ST_MakePoint("center_lng", "center_lat"));--> statement-breakpoint
CREATE INDEX "resource_spatial_index" ON "resources" USING gist ("location");--> statement-breakpoint
CREATE INDEX "user_home_location_spatial_index" ON "user" USING gist ("homeLocation");--> statement-breakpoint
CREATE INDEX "user_last_known_location_spatial_index" ON "user" USING gist ("lastKnownLocation");