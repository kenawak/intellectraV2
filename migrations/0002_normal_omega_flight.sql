CREATE TABLE "bookmarked_idea" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"unmet_needs" text[] DEFAULT '{}',
	"product_idea" text[] DEFAULT '{}',
	"proof_of_concept" text DEFAULT '',
	"source_url" text,
	"prompt_used" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idea" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"unmet_needs" text[] DEFAULT '{}',
	"product_idea" text[] DEFAULT '{}',
	"proof_of_concept" text DEFAULT '',
	"source_url" text,
	"prompt_used" text,
	"confidence_score" integer,
	"suggested_platforms" text[] DEFAULT '{}',
	"creation_date" text DEFAULT '',
	"idea_source" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "idea_source_url_unique" UNIQUE("source_url")
);
--> statement-breakpoint
CREATE TABLE "user_analytics" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"route" text NOT NULL,
	"method" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"generation_attempts_count" integer DEFAULT 0,
	"generation_attempts_reset_time" timestamp,
	"generation_attempts_is_rate_limited" boolean DEFAULT false,
	"session_id" text
);
--> statement-breakpoint
ALTER TABLE "bookmarked_idea" ADD CONSTRAINT "bookmarked_idea_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;