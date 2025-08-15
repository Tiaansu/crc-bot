import { ApplyOptions } from '@sapphire/decorators';
import { Listener, UserError } from '@sapphire/framework';
import { SubcommandPluginEvents, type ChatInputSubcommandDeniedPayload } from '@sapphire/plugin-subcommands';
import { MessageFlags } from 'discord.js';

@ApplyOptions<Listener.Options>({
    event: SubcommandPluginEvents.ChatInputSubcommandDenied,
    name: 'subcommand-denied',
})
export class BotListener extends Listener<typeof SubcommandPluginEvents.ChatInputSubcommandDenied> {
    public async run({ message: content }: UserError, { interaction }: ChatInputSubcommandDeniedPayload) {
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
