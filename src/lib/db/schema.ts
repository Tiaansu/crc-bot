import { integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const rolesConfig = pgTable('roles_config', {
    itemId: text('item_id').primaryKey(),
    name: text('name').notNull(),
    type: text('seed').notNull(),
    color: integer('color').notNull(),
});

export const roles = pgTable('roles', {
    id: uuid('id').primaryKey().defaultRandom(),
    guildId: text('guild_id').notNull(),
    roleId: text('role_id').notNull(),
    forType: text('for_type').notNull(),
    forItem: text('for_item').notNull(),
});

export type SelectRoles = typeof roles.$inferSelect;

export const rolePickers = pgTable('role_pickers', {
    id: uuid('id').primaryKey().defaultRandom(),
    guildId: text('guild_id').notNull(),
    channelId: text('channel_id').notNull(),
    messageId: text('message_id').notNull(),
});

export const channels = pgTable('channels', {
    id: uuid('id').primaryKey().defaultRandom(),
    guildId: text('guild_id').notNull(),
    webhookUrl: text('webhook_url').notNull(),
    forType: text('for_type').notNull(),
});

export const offenses = pgTable('offenses', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    currentOffense: integer('current_offense').notNull().default(1),
});
