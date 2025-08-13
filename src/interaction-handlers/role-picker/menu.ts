import { gagCategories } from '@/utils/constants';
import { getCategoryRoles } from '@/utils/get-category-roles';
import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
    EmbedBuilder,
    GuildMember,
    MessageFlags,
    type ActionRowData,
    type ButtonComponentData,
    type StringSelectMenuInteraction,
} from 'discord.js';
import { chunk } from 'lodash';

@ApplyOptions<InteractionHandler.Options>({
    interactionHandlerType: InteractionHandlerTypes.SelectMenu,
    name: 'role-picker-menu',
})
export class RolePickerHandler extends InteractionHandler {
    public override parse(interaction: StringSelectMenuInteraction) {
        const [prefix, category] = interaction.customId.split('_');
        if (prefix !== 'role-picker' || !this.isRolePickerCategory(category)) {
            return this.none();
        }
        return this.some(category);
    }

    public override async run(interaction: StringSelectMenuInteraction, category: string) {
        await interaction.deferUpdate();

        const allCategoryRoles = await getCategoryRoles(interaction.guildId!, category);
        const categoryRoleIds = allCategoryRoles.map((r) => r.roleId);

        const page = this.getCurrentPage(interaction);
        if (page === null) {
            return await interaction.followUp({
                content: 'An error occurred while updating your roles. Could not determine the current page.',
                flags: MessageFlags.Ephemeral,
            });
        }

        const rolesChunks = chunk(categoryRoleIds, 25);
        const rolesOnThisPage = new Set(rolesChunks[page]);

        const member = interaction.member as GuildMember;
        const currentMemberRoleIds = new Set(
            member.roles.cache
                .filter((role) => role.id !== interaction.guildId && !role.managed)
                .map((role) => role.id),
        );

        const selectedRoleIds = new Set(interaction.values);

        const rolesToAdd: string[] = [];
        const rolesToRemove: string[] = [];

        for (const roleId of rolesOnThisPage) {
            const isSelected = selectedRoleIds.has(roleId);
            const userHasRole = currentMemberRoleIds.has(roleId);

            if (isSelected && !userHasRole) {
                rolesToAdd.push(roleId);
            } else if (!isSelected && userHasRole) {
                rolesToRemove.push(roleId);
            }
        }

        const promise = [];
        if (rolesToAdd.length > 0) {
            promise.push(member.roles.add(rolesToAdd, `Role picker: Added ${category} roles`));
        }

        if (rolesToRemove.length > 0) {
            promise.push(member.roles.remove(rolesToRemove, `Role picker: Removed ${category} roles`));
        }

        await Promise.all(promise);

        const embed = new EmbedBuilder()
            .setTitle('Role Picker')
            .setColor('Yellow')
            .setDescription(`Your roles have been successfully updated for this page.`);

        await interaction.followUp({
            embeds: [embed],
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    private getCurrentPage(interaction: StringSelectMenuInteraction): number | null {
        const buttonRow = interaction.message.components[1] as ActionRowData<ButtonComponentData> | null;
        if (!buttonRow) return null;

        const pageButton = buttonRow.components.find((comp) =>
            (comp as { customId: string }).customId.startsWith('role-page_'),
        );
        if (!pageButton || !(pageButton as { customId: string }).customId.startsWith('role-page_')) return null;

        const parts = (pageButton as { customId: string }).customId.split('_');
        const action = parts[1];
        const pageStr = parts[3];
        const page = parseInt(pageStr, 10);

        return action === 'next' ? page - 1 : page + 1;
    }

    private isRolePickerCategory(category: string) {
        return gagCategories.map((item) => item.toLowerCase()).includes(category);
    }
}
