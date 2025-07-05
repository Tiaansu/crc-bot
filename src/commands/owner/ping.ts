import { API_URL } from '@/utils/constants';
import { ping } from '@/utils/ping';
import { ApplyOptions } from '@sapphire/decorators';
import {
    ApplicationCommandRegistry,
    Command,
    type Awaitable,
} from '@sapphire/framework';
import { stripIndents } from 'common-tags';
import { EmbedBuilder, MessageFlags } from 'discord.js';

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

        const embed = new EmbedBuilder().setTitle('Pong!').addFields([
            {
                name: 'Discord',
                value: stripIndents`
                        Roundtrip latency: ${message.createdTimestamp - interaction.createdTimestamp}ms
                        Websocket latency: ${this.container.client.ws.ping}ms
                    `,
                inline: true,
            },
        ]);

        const { error, downloadTime, totalLatency, ttfb } = await ping(
            `${API_URL}/growagarden/stock`,
        );
        if (!error) {
            embed.addFields([
                {
                    name: 'Grow A Garden API',
                    value: stripIndents`
                        Time to First Byte (TTFB): ${ttfb!.toFixed(2)} ms
                        Content Download Time:     ${downloadTime!.toFixed(2)} ms

                        Total Latency:             ${totalLatency!.toFixed(2)} ms
                    `,
                },
            ]);
        }

        return await interaction.editReply({
            embeds: [embed],
        });
    }
}
