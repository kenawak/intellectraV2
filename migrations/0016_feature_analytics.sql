-- Create feature_analytics table for comprehensive feature tracking
CREATE TABLE IF NOT EXISTS "feature_analytics" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"feature" text NOT NULL,
	"action" text NOT NULL,
	"status" text NOT NULL,
	"tokens_used" integer DEFAULT 0 NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"metadata" jsonb,
	"duration" integer,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	CONSTRAINT "feature_analytics_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "feature_analytics_user_id_idx" ON "feature_analytics" ("user_id");
CREATE INDEX IF NOT EXISTS "feature_analytics_feature_idx" ON "feature_analytics" ("feature");
CREATE INDEX IF NOT EXISTS "feature_analytics_timestamp_idx" ON "feature_analytics" ("timestamp");
CREATE INDEX IF NOT EXISTS "feature_analytics_status_idx" ON "feature_analytics" ("status");

