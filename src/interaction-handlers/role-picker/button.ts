import { gagCategories } from '@/utils/constants';
import { prepareAndReply } from '@/utils/prepare-and-reply-role-picker';
import { ApplyOptions } from '@sapphire/decorators';
import {
    InteractionHandler,
    InteractionHandlerTypes,
} from '@sapphire/framework';
import { MessageFlags, type ButtonInteraction } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
    interactionHandlerType: InteractionHandlerTypes.Button,
    name: 'role-picker-buttons',
})
export class RolePickerHandler extends InteractionHandler {
    public override parse(interaction: ButtonInteraction) {
        const [prefix, category] = interaction.customId.split('_');
        if (prefix !== 'role-picker' && !this.isRolePickerCategory(category))
            return this.none();
        return this.some({ category });
    }

    public override async run(
        interaction: ButtonInteraction,
        { category }: { category: string },
    ) {
        await interaction.deferReply({
            flags: MessageFlags.Ephemeral,
        });
        await prepareAndReply(interaction, category, 0, interaction.user.id);
    }

    private isRolePickerCategory(category: string) {
        return gagCategories
            .map((item) => item.toLowerCase())
            .includes(category);
    }
}
