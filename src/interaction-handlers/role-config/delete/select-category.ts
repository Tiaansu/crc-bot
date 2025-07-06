import { prepareAndReplyRoleConfig } from '@/utils/role-config-utils';
import { ApplyOptions } from '@sapphire/decorators';
import {
    InteractionHandler,
    InteractionHandlerTypes,
} from '@sapphire/framework';
import type { StringSelectMenuInteraction } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
    interactionHandlerType: InteractionHandlerTypes.SelectMenu,
    name: 'role-config-delete-select-category',
})
export class RoleConfigHandler extends InteractionHandler {
    public override parse(interaction: StringSelectMenuInteraction) {
        if (interaction.customId !== 'role-config-delete-select-category') {
            return this.none();
        }
        return this.some();
    }

    public override async run(interaction: StringSelectMenuInteraction) {
        await interaction.deferUpdate();

        const category = interaction.values[0];
        return await prepareAndReplyRoleConfig(
            interaction,
            category,
            0,
            interaction.user.id,
            'delete',
        );
    }
}
