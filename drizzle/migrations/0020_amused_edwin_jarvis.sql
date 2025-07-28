CREATE TABLE "offenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"current_offense" integer DEFAULT 0 NOT NULL
);
