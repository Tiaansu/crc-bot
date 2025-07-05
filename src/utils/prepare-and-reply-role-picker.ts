import type { ButtonInteraction, GuildMember } from 'discord.js';
import { getCategoryRoles } from './get-category-roles';
import { db } from '@/lib/db';
import { roles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { container } from '@sapphire/pieces';
import { createPagedRolePickerReply } from './role-picker-utils';

export async function prepareAndReply(
    interaction: ButtonInteraction,
    category: string,
    page: number,
    userId: string,
) {
    const guildId = interaction.guildId!;

    const categoryRolesConfig = await getCategoryRoles(guildId, category);
    const guildRoles = interaction.guild?.roles.cache!;

    const cleanupPromise: Promise<any>[] = [];
    const validCategoryRoles: { name: string; id: string }[] = [];

    for (const dbRole of categoryRolesConfig) {
        const role = guildRoles.get(dbRole.roleId);
        if (role) {
            validCategoryRoles.push({ name: role.name, id: role.id });
        } else {
            cleanupPromise.push(
                db.delete(roles).where(eq(roles.roleId, dbRole.roleId)),
            );
        }
    }

    if (cleanupPromise.length > 0) {
        Promise.all(cleanupPromise).catch(container.logger.error);
    }

    const member = interaction.member as GuildMember;
    const memberRoleIds = new Set(member.roles.cache.map((r) => r.id));

    const replyOptions = createPagedRolePickerReply({
        category,
        allRoles: validCategoryRoles,
        memberRoleIds,
        page,
        userId,
    });

    await interaction.editReply(replyOptions);
}
