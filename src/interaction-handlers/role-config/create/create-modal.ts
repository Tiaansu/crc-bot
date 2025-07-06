import { db } from '@/lib/db';
import { rolesConfig } from '@/lib/db/schema';
import { isValidHexString } from '@/utils/is-valid-hex-string';
import { ApplyOptions } from '@sapphire/decorators';
import {
    InteractionHandler,
    InteractionHandlerTypes,
} from '@sapphire/framework';
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
        if (interaction.customId !== 'role-config-create-modal')
            return this.none();
        return this.some();
    }

    public override async run(interaction: ModalSubmitInteraction) {
        await interaction.deferUpdate();

        const itemId = interaction.fields.getTextInputValue(
            'role-config-create-itemId',
        );
        const itemName = interaction.fields.getTextInputValue(
            'role-config-create-itemName',
        );
        const itemType = interaction.fields.getTextInputValue(
            'role-config-create-itemType',
        );
        const itemHexColor = interaction.fields.getTextInputValue(
            'role-config-create-itemHexColor',
        );

        const roleConfig = await db.query.rolesConfig.findFirst({
            where: eq(rolesConfig.itemId, itemId),
        });
        if (roleConfig) {
            await interaction.editReply({
                content: `Item ID ${inlineCode(itemId)} already exists.`,
                components: [],
                embeds: [],
            });
            return;
        }

        if (!isValidHexString(itemHexColor)) {
            await interaction.editReply('Invalid hex color.');
            return;
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
            .setThumbnail(
                `https://singlecolorimage.com/get/${itemHexColor.slice(1)}/200x200`,
            );

        const confirmButton = new ButtonBuilder()
            .setCustomId('role-config-create-confirm')
            .setLabel('Confirm')
            .setStyle(ButtonStyle.Success);
        const cancelButton = new ButtonBuilder()
            .setCustomId('role-config-create-cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger);
        const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
            confirmButton,
            cancelButton,
        );

        this.container.pendingRoleCreation.set(interaction.user.id, {
            itemId,
            itemName,
            itemType,
            itemHexColor,
        });

        return await interaction.editReply({
            embeds: [embed],
            components: [row],
        });
    }
}
