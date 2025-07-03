import { pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const roles = pgTable('roles', {
    id: uuid('id').primaryKey().defaultRandom(),
    guildId: text('guild_id').notNull(),
    roleId: text('role_id').notNull(),
    forItem: text('for_item').notNull(),
    forType: text('for_type').notNull(),
});

export type SelectRoles = typeof roles.$inferSelect;

export const reactionRoles = pgTable('reaction_roles', {
    id: uuid('id').primaryKey().defaultRandom(),
    guildId: text('guild_id').notNull(),
    messageId: text('message_id').notNull(),
    forType: text('for_type').notNull(),
    items: text('items').notNull(),
});

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
