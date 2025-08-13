import { db } from '@/lib/db';
import { rolesConfig } from '@/lib/db/schema';
import { isValidHexString } from '@/utils/is-valid-hex-string';
import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { stripIndents } from 'common-tags';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    inlineCode,
    type ModalSubmitInteraction,
} from 'discord.js';
import { eq } from 'drizzle-orm';

@ApplyOptions<InteractionHandler.Options>({
    interactionHandlerType: InteractionHandlerTypes.ModalSubmit,
})
export class RoleConfigHandler extends InteractionHandler {
    public override parse(interaction: ModalSubmitInteraction) {
        if (interaction.customId !== 'role-config-edit-modal') {
            return this.none();
        }
        return this.some();
    }

    public override async run(interaction: ModalSubmitInteraction) {
        await interaction.deferUpdate();
        const editingItemId = this.container.currentEditingItemId.get(interaction.user.id);
        if (!editingItemId) {
            return await interaction.editReply({
                content: 'You are not editing a role config.',
                components: [],
                embeds: [],
            });
        }

        const itemId = interaction.fields.getTextInputValue('role-config-edit-itemId');
        const itemName = interaction.fields.getTextInputValue('role-config-edit-itemName');
        const itemType = interaction.fields.getTextInputValue('role-config-edit-itemType');
        const itemHexColor = interaction.fields.getTextInputValue('role-config-edit-itemHexColor');

        const roleConfig = await db.query.rolesConfig.findFirst({
            where: eq(rolesConfig.itemId, editingItemId),
        });
        if (!roleConfig) {
            this.container.currentEditingItemId.delete(interaction.user.id);
            return await interaction.editReply({
                content: 'Role config not found.',
                components: [],
                embeds: [],
            });
        }

        if (!isValidHexString(itemHexColor)) {
            this.container.currentEditingItemId.delete(interaction.user.id);
            return await interaction.editReply({
                content: 'Invalid hex color.',
                components: [],
                embeds: [],
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('Are you sure this is correct?')
            .setDescription(
                stripIndents`
                    Item ID: ${inlineCode(itemId)}
                    Item name: ${inlineCode(itemName)}
                    Item type: ${inlineCode(itemType)}
                    Item hex color: ${inlineCode(itemHexColor)}
                `,
            )
            .setThumbnail(`https://singlecolorimage.com/get/${itemHexColor.slice(1)}/200x200`);

        const confirmButton = new ButtonBuilder()
            .setCustomId('role-config-edit-confirm')
            .setLabel('Confirm')
            .setStyle(ButtonStyle.Success);
        const cancelButton = new ButtonBuilder()
            .setCustomId('role-config-edit-cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger);
        const row = new ActionRowBuilder<ButtonBuilder>().setComponents(confirmButton, cancelButton);

        this.container.pendingRoleCreation.set(interaction.user.id, {
            itemId,
            itemName,
            itemType,
            itemHexColor,
        });

        const hasChanges =
            roleConfig.itemId !== itemId ||
            roleConfig.name !== itemName ||
            roleConfig.type !== itemType ||
            roleConfig.color !== parseInt(itemHexColor.slice(1), 16);

        return await interaction.editReply({
            content: '',
            embeds: hasChanges ? [embed] : [],
            components: [row],
        });
    }
}
