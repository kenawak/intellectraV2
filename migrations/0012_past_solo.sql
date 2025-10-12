CREATE TABLE "github_project" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"repo_url" text NOT NULL,
	"repo_name" text NOT NULL,
	"repo_description" text,
	"repo_language" text,
	"inferred_tech_stack" text,
	"cursor_prompt" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "github_project" ADD CONSTRAINT "github_project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;