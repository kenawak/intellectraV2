ALTER TABLE "github_project" ADD COLUMN "package_json" jsonb;--> statement-breakpoint
ALTER TABLE "github_project" ADD COLUMN "requirements_txt" text;--> statement-breakpoint
ALTER TABLE "github_project" ADD COLUMN "key_files" jsonb;--> statement-breakpoint
ALTER TABLE "github_project" ADD COLUMN "is_analyzed" boolean DEFAULT false;