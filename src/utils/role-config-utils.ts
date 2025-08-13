import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    StringSelectMenuOptionBuilder,
    type MessageEditOptions,
} from 'discord.js';
import { chunk } from 'lodash';
import { getCategoryRolesConfig } from './get-category-roles';

interface PagedRoleConfigOptions {
    category: string;
    allRoles: { name: string; id: string }[];
    page: number;
    userId: string;
    action: string;
}

export function createPagedRoleConfigReply(options: PagedRoleConfigOptions): MessageEditOptions {
    const { category, allRoles, page, userId, action } = options;

    const rolesChunks = chunk(allRoles, 25);
    const currentPageRoles = rolesChunks[page];

    const menu = new StringSelectMenuBuilder()
        .setCustomId(`role-config-${action}_${category}`)
        .setPlaceholder(`Select ${category} roles to ${action}...`)
        .setMinValues(1)
        .setMaxValues(action === 'delete' ? currentPageRoles.length : 1)
        .addOptions(
            currentPageRoles.map((role) => new StringSelectMenuOptionBuilder().setLabel(role.name).setValue(role.id)),
        );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);

    const prevButton = new ButtonBuilder()
        .setCustomId(`role-config-${action}-page_prev_${category}_${page - 1}_${userId}`)
        .setLabel('Previous')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0);

    const nextButton = new ButtonBuilder()
        .setCustomId(`role-config-${action}-page_next_${category}_${page + 1}_${userId}`)
        .setLabel('Next')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= rolesChunks.length - 1);

    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(prevButton, nextButton);

    return {
        content: `Select roles to ${action} from ${category} role config.`,
        components: [row, buttonRow],
    };
}

export async function prepareAndReplyRoleConfig(
    interaction: ButtonInteraction | StringSelectMenuInteraction,
    category: string,
    page: number,
    userId: string,
    action: string,
) {
    const categoryRolesConfig = await getCategoryRolesConfig(category);

    const replyOptions = createPagedRoleConfigReply({
        category,
        allRoles: categoryRolesConfig.map((item) => ({
            name: item.name,
            id: item.itemId,
        })),
        page,
        userId,
        action,
    });

    return await interaction.editReply(replyOptions);
}
