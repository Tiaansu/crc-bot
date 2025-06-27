import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import {
    ContainerBuilder,
    FileBuilder,
    inlineCode,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    MessageFlags,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
    type Message,
} from 'discord.js';

@ApplyOptions<Listener.Options>({
    event: Events.MessageDelete,
})
export class BotListener extends Listener {
    public async run(message: Message<true>) {
        let authorId = (
            'authorId' in message ? message.authorId : message.author?.id
        ) as string;
        if (!authorId) return;

        const { guild } = message;
        const author = guild.members.cache.get(authorId);
        if (!author) {
            return;
        }

        if (author && author.user.bot) return;
        const channel = this.container.client.channels.cache.get(
            this.container.config.deletionChannelId,
        );
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
            `# A message has been deleted!`,
        );
        container
            .addTextDisplayComponents(noticeText)
            .addSeparatorComponents(separator);

        const authorText = new TextDisplayBuilder().setContent(
            `${inlineCode('Author')}: ${message.author ?? 'Unknown'}`,
        );

        const channelText = new TextDisplayBuilder().setContent(
            `${inlineCode('Channel')}: ${message.channel ?? 'Unknown'}`,
        );

        const contextText = new TextDisplayBuilder().setContent(
            [`${inlineCode('Content')}:`, message.content].join('\n'),
        );
        container
            .addTextDisplayComponents(authorText)
            .addTextDisplayComponents(channelText)
            .addTextDisplayComponents(contextText);

        if (message.attachments.size > 0) {
            const label = new TextDisplayBuilder().setContent('Attachments');
            container
                .addSeparatorComponents(separator)
                .addTextDisplayComponents(label);

            const mediaGalleryItems: MediaGalleryItemBuilder[] = [];
            const files: FileBuilder[] = [];
            message.attachments.forEach((attachment) => {
                const isImage = attachment.contentType?.startsWith('image/');
                if (isImage) {
                    mediaGalleryItems.push(
                        new MediaGalleryItemBuilder().setURL(attachment.url),
                    );
                    return;
                }

                files.push(
                    new FileBuilder({
                        file: {
                            url: `attachment://${attachment.name}`,
                        },
                    }),
                );
            });

            if (mediaGalleryItems.length > 0) {
                container.addMediaGalleryComponents(
                    new MediaGalleryBuilder().addItems(...mediaGalleryItems),
                );
            }

            if (files.length > 0) {
                container.addFileComponents(...files);
            }
        }

        await channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
            files: message.attachments.map((attachment) => attachment.url),
            allowedMentions: { parse: [] },
        });
    }
}
