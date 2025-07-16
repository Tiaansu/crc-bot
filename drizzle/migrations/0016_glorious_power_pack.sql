CREATE TABLE "pending_verification" (
	"token" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"discord_id" text NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verified_users" (
	"id" text PRIMARY KEY NOT NULL,
	"ip" text NOT NULL
);
