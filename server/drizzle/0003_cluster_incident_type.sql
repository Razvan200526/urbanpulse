ALTER TABLE "pulse_clusters" ADD COLUMN "incident_type_id" uuid;--> statement-breakpoint
ALTER TABLE "pulse_clusters" ADD CONSTRAINT "pulse_clusters_incident_type_id_incident_type_id_fk" FOREIGN KEY ("incident_type_id") REFERENCES "public"."incident_type"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_clusters_incident_type_id" ON "pulse_clusters" USING btree ("incident_type_id");
