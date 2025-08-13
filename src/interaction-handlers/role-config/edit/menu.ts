import { db } from '@/lib/db';
import { rolesConfig } from '@/lib/db/schema';
import { gagCategories } from '@/utils/constants';
import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    type StringSelectMenuInteraction,
} from 'discord.js';
import { eq } from 'drizzle-orm';

@ApplyOptions<InteractionHandler.Options>({
    interactionHandlerType: InteractionHandlerTypes.SelectMenu,
    name: 'role-config-edit-menu',
})
export class RoleConfigHandler extends InteractionHandler {
    public override parse(interaction: StringSelectMenuInteraction) {
        const [prefix, category] = interaction.customId.split('_');
        if (prefix !== 'role-config-edit' || !this.isRoleConfigCategory(category)) {
            return this.none();
        }
        return this.some(category);
    }

    public override async run(interaction: StringSelectMenuInteraction) {
        const roleConfig = await db.query.rolesConfig.findFirst({
            where: eq(rolesConfig.itemId, interaction.values[0]),
        });

        if (!roleConfig) {
            await interaction.deferUpdate();
            return await interaction.editReply({
                content: 'Role config not found.',
                components: [],
                embeds: [],
            });
        }

        const { itemId, name, color, type } = roleConfig;

        const modal = new ModalBuilder().setCustomId('role-config-edit-modal').setTitle('Role Config');

        const itemIdInput = new TextInputBuilder()
            .setCustomId('role-config-edit-itemId')
            .setLabel('Item ID')
            .setPlaceholder('e.g. sugar_apple')
            .setValue(itemId)
            .setRequired(true)
            .setStyle(TextInputStyle.Short);
        const itemIdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(itemIdInput);

        const itemNameInput = new TextInputBuilder()
            .setCustomId('role-config-edit-itemName')
            .setLabel('Item Name')
            .setPlaceholder('e.g. Sugar Apple')
            .setValue(name)
            .setRequired(true)
            .setStyle(TextInputStyle.Short);
        const itemNameRow = new ActionRowBuilder<TextInputBuilder>().addComponents(itemNameInput);

        const itemTypeInput = new TextInputBuilder()
            .setCustomId('role-config-edit-itemType')
            .setLabel('Item Type')
            .setPlaceholder('e.g. seed')
            .setValue(type)
            .setRequired(true)
            .setStyle(TextInputStyle.Short);
        const itemTypeRow = new ActionRowBuilder<TextInputBuilder>().addComponents(itemTypeInput);

        const itemHexColor = new TextInputBuilder()
            .setCustomId('role-config-edit-itemHexColor')
            .setLabel('Item Hex Color')
            .setPlaceholder('e.g. #ff0000')
            .setValue(`#${color.toString(16).padStart(6, '0')}`)
            .setRequired(true)
            .setStyle(TextInputStyle.Short);
        const hexRow = new ActionRowBuilder<TextInputBuilder>().setComponents(itemHexColor);

        this.container.currentEditingItemId.set(interaction.user.id, itemId);
        modal.addComponents(itemIdRow, itemNameRow, itemTypeRow, hexRow);
        return await interaction.showModal(modal);
    }

    private isRoleConfigCategory(category: string) {
        return gagCategories.map((item) => item.toLowerCase()).includes(category);
    }
}
