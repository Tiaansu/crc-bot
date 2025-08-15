CREATE TABLE "sticky_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" text NOT NULL,
	"channel_id" text NOT NULL,
	"message" text NOT NULL,
	"last_message_id" text
);
