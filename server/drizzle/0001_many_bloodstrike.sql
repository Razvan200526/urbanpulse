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
ALTER TABLE "pulse_cluster_members" ADD CONSTRAINT "pulse_cluster_members_pulse_id_pulse_id_fk" FOREIGN KEY ("pulse_id") REFERENCES "public"."pulse"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_cluster_members" ADD CONSTRAINT "pulse_cluster_members_cluster_id_pulse_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."pulse_clusters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_clusters_location" ON "pulse_clusters" USING gist (ST_MakePoint("center_lng", "center_lat"));