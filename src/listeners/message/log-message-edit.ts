import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import {
    bold,
    ContainerBuilder,
    MessageFlags,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
    type Message,
} from 'discord.js';

@ApplyOptions<Listener.Options>({
    event: Events.MessageUpdate,
})
export class BotListener extends Listener {
    public async run(oldMessage: Message<true>, newMessage: Message<true>) {
        const { client, config } = this.container;

        if (newMessage.author.bot) return;

        let fullMessage = oldMessage;
        if (oldMessage.partial) {
            fullMessage = await oldMessage.fetch(true);
        }
        // uncached
        if (fullMessage.content === newMessage.content) return;

        const channel = client.channels.cache.get(config.logsChannelId);
        if (!channel) {
            return;
        }

        if (!channel.isSendable()) {
            return;
        }

        const container = new ContainerBuilder();
        const separator = new SeparatorBuilder().setSpacing(
            SeparatorSpacingSize.Large,
        );

        const noticeText = new TextDisplayBuilder().setContent(
            `# A message was edited!`,
        );
        container
            .addTextDisplayComponents(noticeText)
            .addSeparatorComponents(separator);

        const authorText = new TextDisplayBuilder().setContent(
            `${bold('Author')}: ${newMessage.author ?? 'Unknown'}`,
        );
        const channelText = new TextDisplayBuilder().setContent(
            `${bold('Channel')}: ${newMessage.channel ?? 'Unknown'}`,
        );
        const linkText = new TextDisplayBuilder().setContent(
            `${bold('Jump to message')}: ${newMessage.url}`,
        );

        const oldText = new TextDisplayBuilder().setContent(
            [`${bold('Before')}:`, `${fullMessage.content}`].join('\n'),
        );

        const newText = new TextDisplayBuilder().setContent(
            [`${bold('After')}:`, `${newMessage.content}`].join('\n'),
        );

        container
            .addTextDisplayComponents(authorText)
            .addTextDisplayComponents(channelText)
            .addTextDisplayComponents(linkText)
            .addSeparatorComponents(separator)
            .addTextDisplayComponents(oldText)
            .addTextDisplayComponents(newText);

        await channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    }
}
