CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
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
	"confidence_score" integer,
	"suggested_platforms" jsonb DEFAULT '[]'::jsonb,
	"requirements" text,
	"design" text,
	"tasks" text,
	"code_stubs" jsonb,
	"cursor_prompt" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github_project" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"repo_url" text NOT NULL,
	"repo_name" text NOT NULL,
	"repo_description" text,
	"repo_language" text,
	"inferred_tech_stack" text,
	"package_json" jsonb,
	"requirements_txt" text,
	"key_files" jsonb,
	"is_analyzed" boolean DEFAULT false,
	"last_analyzed_at" timestamp,
	"cursor_prompt" text,
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
	"suggested_platforms" text DEFAULT '[]',
	"creation_date" text DEFAULT '',
	"idea_source" text DEFAULT '',
	"requirements" text,
	"design" text,
	"tasks" text,
	"code_stubs" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "idea_source_url_unique" UNIQUE("source_url")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "token_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"tokens_used" integer NOT NULL,
	"operation" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"total_tokens" integer
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text DEFAULT 'user',
	CONSTRAINT "user_email_unique" UNIQUE("email")
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
	"tokens_used_this_hour" integer DEFAULT 0,
	"tokens_reset_time" timestamp,
	"is_token_rate_limited" boolean DEFAULT false,
	"token_limit_per_hour" integer DEFAULT 100000,
	"session_id" text,
	"spec_generations_today" integer DEFAULT 0,
	"spec_generations_reset_date" timestamp,
	CONSTRAINT "user_analytics_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "userprofile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"customer_id" text,
	"total_tokens_spent" integer DEFAULT 0 NOT NULL,
	"token_limit" integer DEFAULT 10000 NOT NULL,
	"gemini_api_key_encrypted" text,
	"gemini_api_key_iv" text,
	"gemini_api_key_version" integer DEFAULT 1,
	"market_specialization" text,
	"specialization_path" text[] DEFAULT '{}',
	"onboarding_complete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vote" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"idea_id" text NOT NULL,
	"vote_type" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarked_idea" ADD CONSTRAINT "bookmarked_idea_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_project" ADD CONSTRAINT "github_project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userprofile" ADD CONSTRAINT "userprofile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote" ADD CONSTRAINT "vote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote" ADD CONSTRAINT "vote_idea_id_idea_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."idea"("id") ON DELETE cascade ON UPDATE no action;