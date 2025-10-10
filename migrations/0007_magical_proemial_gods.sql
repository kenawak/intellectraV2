ALTER TABLE "vote" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "vote" ADD COLUMN "ip_address" text;--> statement-breakpoint
ALTER TABLE "vote" ADD COLUMN "user_agent" text;