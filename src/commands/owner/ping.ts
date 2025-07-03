import { ApplyOptions } from '@sapphire/decorators';
import {
    ApplicationCommandRegistry,
    Command,
    type Awaitable,
} from '@sapphire/framework';
import { stripIndents } from 'common-tags';
import { MessageFlags } from 'discord.js';

@ApplyOptions<Command.Options>({
    name: 'ping',
    description: 'Ping the bot',
    preconditions: ['BotOwnerOnly'],
})
export class BotCommand extends Command {
    public override registerApplicationCommands(
        registry: ApplicationCommandRegistry,
    ): Awaitable<void> {
        registry.registerChatInputCommand((builder) =>
            builder.setName(this.name).setDescription(this.description),
        );
    }

    public override async chatInputRun(
        interaction: Command.ChatInputCommandInteraction,
    ) {
        const message = await interaction.deferReply({
            flags: MessageFlags.Ephemeral,
        });

        return await interaction.editReply(
            stripIndents`
                Pong!

                Roundtrip latency: ${message.createdTimestamp - interaction.createdTimestamp}ms
                Websocket latency: ${this.container.client.ws.ping}ms
            `,
        );
    }
}
