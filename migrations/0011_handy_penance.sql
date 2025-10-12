ALTER TABLE "idea" ALTER COLUMN "suggested_platforms" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "idea" ALTER COLUMN "suggested_platforms" SET DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "bookmarked_idea" ADD COLUMN "cursor_prompt" text;