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
ALTER TABLE "user_analytics" ADD COLUMN "tokens_used_this_hour" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_analytics" ADD COLUMN "tokens_reset_time" timestamp;--> statement-breakpoint
ALTER TABLE "user_analytics" ADD COLUMN "is_token_rate_limited" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user_analytics" ADD COLUMN "token_limit_per_hour" integer DEFAULT 5000;--> statement-breakpoint
ALTER TABLE "userprofile" ADD COLUMN "total_tokens_spent" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "userprofile" ADD COLUMN "token_limit" integer DEFAULT 10000 NOT NULL;--> statement-breakpoint
ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;