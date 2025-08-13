import {
    ActionRowBuilder,
    bold,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    type MessageEditOptions,
} from 'discord.js';
import { capitalize, chunk } from 'lodash';

interface PagedRolePickerOptions {
    category: string;
    allRoles: { name: string; id: string }[];
    memberRoleIds: Set<string>;
    page: number;
    userId: string;
}

export function createPagedRolePickerReply(options: PagedRolePickerOptions): MessageEditOptions {
    const { category, allRoles, memberRoleIds, page, userId } = options;

    const rolesChunks = chunk(allRoles, 25);
    const currentPageRoles = rolesChunks[page];

    const menu = new StringSelectMenuBuilder()
        .setCustomId(`role-picker_${category}`)
        .setPlaceholder(`Select or unselect ${category} roles...`)
        .setMinValues(0)
        .setMaxValues(currentPageRoles.length)
        .addOptions(
            currentPageRoles.map((role) =>
                new StringSelectMenuOptionBuilder()
                    .setLabel(role.name)
                    .setValue(role.id)
                    .setDefault(memberRoleIds.has(role.id)),
            ),
        );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);

    const prevButton = new ButtonBuilder()
        .setCustomId(`role-page_prev_${category}_${page - 1}_${userId}`)
        .setLabel('Previous')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0);

    const nextButton = new ButtonBuilder()
        .setCustomId(`role-page_next_${category}_${page + 1}_${userId}`)
        .setLabel('Next')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page >= rolesChunks.length - 1);

    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(prevButton, nextButton);

    return {
        content: `Select or unselect roles from the ${bold(capitalize(category))} category (Page ${page + 1} of ${rolesChunks.length}).`,
        components: [row, buttonRow],
    };
}
