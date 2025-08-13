import { prepareAndReply } from '@/utils/prepare-and-reply-role-picker';
import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { MessageFlags, type ButtonInteraction } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
    interactionHandlerType: InteractionHandlerTypes.Button,
    name: 'role-picker-pagination',
})
export class RolePickerHandler extends InteractionHandler {
    public override async parse(interaction: ButtonInteraction) {
        const [prefix, action, category, pageStr, userId] = interaction.customId.split('_');

        if (prefix !== 'role-page' || (action !== 'prev' && action !== 'next')) {
            return this.none();
        }

        if (interaction.user.id !== userId) {
            await interaction.reply({
                content: "You cannot control someone else's role picker.",
                flags: MessageFlags.Ephemeral,
            });
            return this.none();
        }

        return this.some({ page: parseInt(pageStr, 10), category, userId });
    }

    public override async run(
        interaction: ButtonInteraction,
        { page, category, userId }: { page: number; category: string; userId: string },
    ) {
        await interaction.deferUpdate();
        await prepareAndReply(interaction, category, page, userId);
    }
}
