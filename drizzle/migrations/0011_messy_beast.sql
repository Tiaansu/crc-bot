ALTER TABLE "roles" DROP CONSTRAINT "roles_for_item_roles_config_item_id_fk";
--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_for_item_roles_config_item_id_fk" FOREIGN KEY ("for_item") REFERENCES "public"."roles_config"("item_id") ON DELETE cascade ON UPDATE no action;