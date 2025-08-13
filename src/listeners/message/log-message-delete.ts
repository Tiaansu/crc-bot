import { addFields, truncateEmbed } from '@/utils/embed';
import { isFlaggedForShutdown } from '@/utils/flag-for-shutdown';
import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { envParseString } from '@skyra/env-utilities';
import { inlineCode, messageLink, MessageType, type Message } from 'discord.js';

@ApplyOptions<Listener.Options>({
    event: Events.MessageDelete,
})
export class BotListener extends Listener {
    public async run(message: Message<true>) {
        if (envParseString('NODE_ENV') !== 'development' && message.guildId !== this.container.config.guildId) return;
        if (isFlaggedForShutdown()) return;
        if (message.author?.bot) {
            return;
        }

        if (!message.inGuild()) {
            return;
        }

        if (!message.content.length && !message.embeds.length && !message.attachments.size && !message.stickers.size) {
            return;
        }

        if (message.channel.id === this.container.config.tradingChannelId) {
            return;
        }

        const infoParts = [
            `• Channel: ${message.channel.toString()} - ${message.channel.name} (${message.channel.id})`,
        ];

        let embed = addFields({
            author: {
                name: `${message.author.displayName} (${message.author.id})`,
                icon_url: message.author.displayAvatarURL(),
            },
            color: 0xb75cff,
            title: 'Message deleted',
            description: `${message.content.length ? message.content : '<No message content>'}`,
            footer: {
                text: message.id,
            },
            timestamp: new Date().toISOString(),
        });

        if (!message.content && message.embeds.length) {
            infoParts.push(`• Embeds: ${message.embeds.length}`);
        }

        if (message.attachments.size) {
            const attachmentParts = [];
            let counter = 1;

            for (const attachment of message.attachments.values()) {
                attachmentParts.push(`[attachment-${counter}](${attachment.proxyURL})`);
                counter++;
            }

            infoParts.push(`• Attachments: ${attachmentParts.join(' ')}`);
        }

        if (message.stickers.size) {
            infoParts.push(`• Stickers: ${message.stickers.map((sticker) => inlineCode(sticker.name)).join(', ')}`);
        }

        infoParts.push(`• [Jump to](${message.url})`);

        if (message.type === MessageType.Reply && message.reference && message.mentions.repliedUser) {
            const { channelId, messageId, guildId } = message.reference;
            const replyUrl = messageLink(channelId, messageId!, guildId!);

            infoParts.push(
                message.mentions.users.has(message.mentions.repliedUser.id)
                    ? `• @Replying to [${messageId}](${replyUrl}) by ${inlineCode(message.mentions.repliedUser.displayName)} (${message.mentions.repliedUser.id})`
                    : `• Replying to [${messageId}](${replyUrl}) by ${inlineCode(message.mentions.repliedUser.displayName)} (${message.mentions.repliedUser.id})`,
            );
        }

        embed = addFields(embed, {
            name: '\u200B',
            value: infoParts.join('\n'),
        });

        const channel = this.container.client.channels.cache.get(this.container.config.logsChannelId);
        if (!channel || !channel.isSendable()) return;

        await channel.send({
            embeds: [truncateEmbed(embed)],
        });
    }
}
