import { reactionRolesEmoji } from '@/lib/data/roles';
import { db } from '@/lib/db';
import { reactionRoles, roles } from '@/lib/db/schema';
import type {
    ApplicationEmoji,
    GuildEmoji,
    Message,
    MessageReaction,
    PartialMessage,
    ReactionEmoji,
    User,
} from 'discord.js';
import { and, eq } from 'drizzle-orm';

export async function handleReactionRole(
    reaction: MessageReaction,
    user: User,
    type: 'add' | 'remove',
) {
    if (user.bot) return;
    if (!reaction.message.guildId) return;

    const emojiIndex = getEmojiIndex(reaction.emoji);
    if (emojiIndex === -1) return;

    const reactionConfig = await getReactionRoleConfig(reaction.message);
    if (!reactionConfig) return;

    const item = reactionConfig.items.split(',')[emojiIndex];
    if (!item) return;

    const role = await getRoleForType(
        reaction.message,
        item,
        reactionConfig.forType,
    );
    if (!role) return;

    const member = reaction.message.guild?.members.cache.get(user.id);
    if (!member) return;

    if (type === 'add' && !member.roles.cache.has(role.roleId))
        await member.roles.add(role.roleId);
    if (type === 'remove' && member.roles.cache.has(role.roleId))
        await member.roles.remove(role.roleId);
}

function getEmojiIndex(emoji: GuildEmoji | ReactionEmoji | ApplicationEmoji) {
    return reactionRolesEmoji.findIndex((e) => e.encoded === emoji.identifier);
}

async function getReactionRoleConfig(
    message: Message<boolean> | PartialMessage,
) {
    return db.query.reactionRoles.findFirst({
        where: and(
            eq(reactionRoles.guildId, message.guildId!),
            eq(reactionRoles.messageId, message.id),
        ),
    });
}

async function getRoleForType(
    message: Message<boolean> | PartialMessage,
    item: string,
    type: string,
) {
    return db.query.roles.findFirst({
        where: and(
            eq(roles.guildId, message.guildId!),
            eq(roles.forItem, item),
            eq(roles.forType, type),
        ),
    });
}
