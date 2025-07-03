CREATE TABLE "role_pickers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" text NOT NULL,
	"message_id" text NOT NULL
);
