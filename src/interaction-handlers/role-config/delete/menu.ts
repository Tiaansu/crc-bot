import { db } from '@/lib/db';
import { rolesConfig } from '@/lib/db/schema';
import { gagCategories } from '@/utils/constants';
import { getCategoryRolesConfig } from '@/utils/get-category-roles';
import { syncRolesForGuild } from '@/utils/sync-roles-for-guild';
import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { type ActionRowData, type ButtonComponentData, type StringSelectMenuInteraction } from 'discord.js';
import { eq } from 'drizzle-orm';
import { chunk } from 'lodash';

@ApplyOptions<InteractionHandler.Options>({
    interactionHandlerType: InteractionHandlerTypes.SelectMenu,
    name: 'role-config-delete-menu',
})
export class RoleConfigHandler extends InteractionHandler {
    public override parse(interaction: StringSelectMenuInteraction) {
        const [prefix, category] = interaction.customId.split('_');
        if (prefix !== 'role-config-delete' || !this.isRoleConfigCategory(category)) {
            return this.none();
        }
        return this.some(category);
    }

    public override async run(interaction: StringSelectMenuInteraction, category: string) {
        await interaction.deferUpdate();
        await interaction.editReply({
            content: 'Deleting roles...',
            components: [],
            embeds: [],
        });

        const allCategoryRolesConfig = await getCategoryRolesConfig(category);
        const categoryRoleDbIds = allCategoryRolesConfig.map((r) => r.itemId);

        const page = this.getCurrentPage(interaction);
        if (page === null) {
            return await interaction.editReply({
                content: 'An error occurred while deleting roles. Could not determine the current page.',
                components: [],
                embeds: [],
            });
        }

        const rolesChunks = chunk(categoryRoleDbIds, 25);
        const rolesOnThisPage = new Set(rolesChunks[page]);

        const selectedItemIds = interaction.values;

        const rolesToDelete = [...selectedItemIds]
            .filter((id) => rolesOnThisPage.has(id))
            .map((id) => db.delete(rolesConfig).where(eq(rolesConfig.itemId, id)));

        await Promise.all(rolesToDelete);

        const guilds = this.container.client.guilds.cache;
        const promise = [];

        for (const [, guild] of guilds) {
            promise.push(syncRolesForGuild(guild));
        }
        await Promise.all(promise);

        return await interaction.editReply({
            content: `Deleted ${selectedItemIds.length} role${selectedItemIds.length === 1 ? '' : 's'}.`,
            components: [],
            embeds: [],
        });
    }

    private getCurrentPage(interaction: StringSelectMenuInteraction): number | null {
        const buttonRow = interaction.message.components[1] as ActionRowData<ButtonComponentData> | null;
        if (!buttonRow) return null;

        const pageButton = buttonRow.components.find((c) =>
            (c as { customId: string }).customId.startsWith('role-config-delete-page_'),
        );
        if (!pageButton || !(pageButton as { customId: string }).customId.startsWith('role-config-delete-page_'))
            return null;

        const parts = (pageButton as { customId: string }).customId.split('_');
        const action = parts[1];
        const pageStr = parts[3];
        const page = parseInt(pageStr, 10);

        return action === 'next' ? page - 1 : page + 1;
    }

    private isRoleConfigCategory(category: string) {
        return gagCategories.map((item) => item.toLowerCase()).includes(category);
    }
}
