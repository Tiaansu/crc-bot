import { gagCategories } from '@/utils/constants';
import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    type ButtonInteraction,
} from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
    interactionHandlerType: InteractionHandlerTypes.Button,
})
export class RoleConfigHandler extends InteractionHandler {
    public override parse(interaction: ButtonInteraction) {
        if (interaction.customId !== 'role-config-edit') return this.none();
        return this.some();
    }

    public override async run(interaction: ButtonInteraction) {
        await interaction.deferUpdate();

        const menu = new StringSelectMenuBuilder()
            .setCustomId('role-config-edit-select-category')
            .setPlaceholder('Select a category...')
            .setMaxValues(1)
            .setMinValues(1)
            .setOptions(
                gagCategories.map((item) =>
                    new StringSelectMenuOptionBuilder().setLabel(item).setValue(item.toLowerCase()),
                ),
            );

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);

        return await interaction.editReply({
            content: `Select category...`,
            embeds: [],
            components: [row],
        });
    }
}
