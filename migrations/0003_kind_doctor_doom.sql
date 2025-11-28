CREATE TABLE "workspace_ideas" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"idea_name" text NOT NULL,
	"validation_score" integer NOT NULL,
	"target_market" text,
	"validation_data" jsonb,
	"starter_prompt" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_opportunities" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"topic" text NOT NULL,
	"opportunity_name" text NOT NULL,
	"persona" text NOT NULL,
	"score" integer NOT NULL,
	"pain_point" text NOT NULL,
	"monetization" text NOT NULL,
	"core_features" text[] DEFAULT '{}',
	"market_proof" text,
	"starter_prompt" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace_ideas" ADD CONSTRAINT "workspace_ideas_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_opportunities" ADD CONSTRAINT "workspace_opportunities_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;