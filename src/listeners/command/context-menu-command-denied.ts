import { isFlaggedForShutdown } from '@/utils/flag-for-shutdown';
import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener, UserError, type ContextMenuCommandDeniedPayload } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';

@ApplyOptions<Listener.Options>({
    event: Events.ContextMenuCommandDenied,
})
export class BotListener extends Listener<typeof Events.ContextMenuCommandDenied> {
    public async run({ message: content }: UserError, { interaction }: ContextMenuCommandDeniedPayload) {
        if (isFlaggedForShutdown()) return;

        if (interaction.deferred || interaction.replied) {
            return await interaction.editReply({
                content,
                allowedMentions: { users: [interaction.user.id], roles: [] },
            });
        }

        return await interaction.reply({
            content,
            allowedMentions: { users: [interaction.user.id], roles: [] },
            flags: MessageFlags.Ephemeral,
        });
    }
}
