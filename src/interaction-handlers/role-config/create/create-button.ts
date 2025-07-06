import { ApplyOptions } from '@sapphire/decorators';
import {
    InteractionHandler,
    InteractionHandlerTypes,
} from '@sapphire/framework';
import {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    type ButtonInteraction,
} from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
    interactionHandlerType: InteractionHandlerTypes.Button,
})
export class RoleConfigHandler extends InteractionHandler {
    public override parse(interaction: ButtonInteraction) {
        if (interaction.customId !== 'role-config-create') return this.none();
        return this.some();
    }

    public override async run(interaction: ButtonInteraction) {
        const modal = new ModalBuilder()
            .setCustomId('role-config-create-modal')
            .setTitle('Role Config');

        const itemIdInput = new TextInputBuilder()
            .setCustomId('role-config-create-itemId')
            .setLabel('Item ID')
            .setPlaceholder('e.g. sugar_apple')
            .setRequired(true)
            .setStyle(TextInputStyle.Short);
        const itemIdRow =
            new ActionRowBuilder<TextInputBuilder>().addComponents(itemIdInput);

        const itemNameInput = new TextInputBuilder()
            .setCustomId('role-config-create-itemName')
            .setLabel('Item Name')
            .setPlaceholder('e.g. Sugar Apple')
            .setRequired(true)
            .setStyle(TextInputStyle.Short);
        const itemNameRow =
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                itemNameInput,
            );

        const itemTypeInput = new TextInputBuilder()
            .setCustomId('role-config-create-itemType')
            .setLabel('Item Type')
            .setPlaceholder('e.g. seed')
            .setRequired(true)
            .setStyle(TextInputStyle.Short);
        const itemTypeRow =
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                itemTypeInput,
            );

        const itemHexColor = new TextInputBuilder()
            .setCustomId('role-config-create-itemHexColor')
            .setLabel('Item Hex Color')
            .setPlaceholder('e.g. #ff0000')
            .setRequired(true)
            .setStyle(TextInputStyle.Short);

        const hexRow = new ActionRowBuilder<TextInputBuilder>().setComponents(
            itemHexColor,
        );

        modal.addComponents(itemIdRow, itemNameRow, itemTypeRow, hexRow);
        return await interaction.showModal(modal);
    }
}
