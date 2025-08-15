import { addFields } from '@/utils/embed';
import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { stripIndents } from 'common-tags';
import { diffLines, diffWords } from 'diff';
import { escapeMarkdown, type Message } from 'discord.js';

@ApplyOptions<Listener.Options>({
    event: Events.MessageUpdate,
})
export class BotListener extends Listener {
    public async run(oldMessage: Message<true>, newMessage: Message<true>) {
        if (newMessage.author.bot) return;
        if (!newMessage.inGuild()) return;

        if (escapeMarkdown(oldMessage.content) === escapeMarkdown(newMessage.content)) {
            return;
        }

        let description: string = '';

        if (/```(.*?)```/s.test(oldMessage.content) && /```(.*?)```/s.test(newMessage.content)) {
            const strippedOldMessage = /```(?:(\S+)\n)?\s*([^]+?)\s*```/.exec(oldMessage.content);

            if (!strippedOldMessage?.[2]) {
                return;
            }

            const strippedNewMessage = /```(?:(\S+)\n)?\s*([^]+?)\s*```/.exec(newMessage.content);
            if (!strippedNewMessage?.[2]) {
                return;
            }

            if (strippedOldMessage[2] === strippedNewMessage[2]) {
                return;
            }

            const diffMessage = diffLines(strippedOldMessage[2], strippedNewMessage[2], { newlineIsToken: true });

            for (const part of diffMessage) {
                if (part.value === '\n') {
                    continue;
                }

                const deleted = part.added ? '+ ' : part.removed ? '- ' : '';
                description += `${deleted}${part.value.replaceAll('\n', '')}\n`;
            }

            const prepend = '```diff\n';
            const append = '\n```';
            description = `${prepend}${description.slice(0, 3_900)}${append}`;
        } else {
            const diffMessage = diffWords(escapeMarkdown(oldMessage.content), escapeMarkdown(newMessage.content));

            for (const part of diffMessage) {
                const markdown = part.added ? '**' : part.removed ? '~~' : '';
                description += `${markdown}${part.value}${markdown}`;
            }

            description = `${description.slice(0, 3_900)}` || '\u200B';
        }

        const info = stripIndents`
            • Channel: ${newMessage.channel.toString()} - ${newMessage.inGuild() ? newMessage.channel.name : ''}(${newMessage.channel.id})
            • [Jump to](${newMessage.url})
        `;

        const embed = addFields(
            {
                author: {
                    name: `${newMessage.author.displayName} (${newMessage.author.id})`,
                    icon_url: newMessage.author.displayAvatarURL(),
                },
                color: 0x5c6cff,
                title: 'Message edited',
                description,
                footer: {
                    text: newMessage.id,
                },
                timestamp: new Date().toISOString(),
            },
            {
                name: '\u200B',
                value: info,
            },
        );

        const channel = this.container.client.channels.cache.get(this.container.config.logsChannelId);
        if (!channel || !channel.isSendable()) {
            return;
        }

        await channel.send({
            embeds: [embed],
        });
    }
}
