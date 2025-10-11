ALTER TABLE "bookmarked_idea" ADD COLUMN "confidence_score" integer;--> statement-breakpoint
ALTER TABLE "bookmarked_idea" ADD COLUMN "suggested_platforms" text DEFAULT '[]';