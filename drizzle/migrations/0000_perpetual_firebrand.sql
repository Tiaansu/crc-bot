CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" text NOT NULL,
	"role_id" text NOT NULL,
	"for_item" text NOT NULL,
	"for_type" text NOT NULL
);
