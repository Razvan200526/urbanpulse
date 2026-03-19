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
	"userId" text NOT NULL
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
	"petType" text NOT NULL,
	"color" text NOT NULL,
	"breed" text,
	"imageUrl" text,
	"aiDescriptor" text
);
--> statement-breakpoint
CREATE TABLE "pet_match" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lostAlertId" uuid NOT NULL,
	"foundAlertId" uuid NOT NULL,
	"confidenceScore" double precision NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pulse" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"userId" text NOT NULL,
	"urgency" text NOT NULL,
	"title" varchar(30) NOT NULL,
	"description" text,
	"position" geometry(Point, 4326) NOT NULL,
	"isResolved" boolean DEFAULT false NOT NULL,
	"isVerified" boolean,
	"createdAt" timestamp DEFAULT now() NOT NULL
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
	"createdAt" timestamp DEFAULT now() NOT NULL
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
	"isVerified" boolean DEFAULT false,
	"rememberMe" boolean DEFAULT false,
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
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pet_alert" ADD CONSTRAINT "pet_alert_pulseId_pulse_id_fk" FOREIGN KEY ("pulseId") REFERENCES "public"."pulse"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pet_match" ADD CONSTRAINT "pet_match_lostAlertId_pet_alert_id_fk" FOREIGN KEY ("lostAlertId") REFERENCES "public"."pet_alert"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pet_match" ADD CONSTRAINT "pet_match_foundAlertId_pet_alert_id_fk" FOREIGN KEY ("foundAlertId") REFERENCES "public"."pet_alert"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse" ADD CONSTRAINT "pulse_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_confirmation" ADD CONSTRAINT "pulse_confirmation_pulseId_pulse_id_fk" FOREIGN KEY ("pulseId") REFERENCES "public"."pulse"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_confirmation" ADD CONSTRAINT "pulse_confirmation_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response" ADD CONSTRAINT "response_pulseId_pulse_id_fk" FOREIGN KEY ("pulseId") REFERENCES "public"."pulse"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response" ADD CONSTRAINT "response_responderId_user_id_fk" FOREIGN KEY ("responderId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiet_hours" ADD CONSTRAINT "quiet_hours_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_reporterId_user_id_fk" FOREIGN KEY ("reporterId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_targetUserId_user_id_fk" FOREIGN KEY ("targetUserId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_targetPulseId_pulse_id_fk" FOREIGN KEY ("targetPulseId") REFERENCES "public"."pulse"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill" ADD CONSTRAINT "skill_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_resourceId_resources_id_fk" FOREIGN KEY ("resourceId") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_borrowerId_user_id_fk" FOREIGN KEY ("borrowerId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_lenderId_user_id_fk" FOREIGN KEY ("lenderId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
