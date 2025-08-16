import { db } from '@/lib/db';
import { stickyMessages } from '@/lib/db/schema';
import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { ChannelType, DiscordAPIError, RESTJSONErrorCodes, type Message, type TextChannel } from 'discord.js';
import { and, eq } from 'drizzle-orm';
import { safeAwait } from '@/utils/safe-await';

@ApplyOptions<Listener.Options>({
    event: Events.MessageCreate,
})
export class BotListener extends Listener {
    public async run(message: Message) {
        const { stickyMessageTimeouts, client, stickyMessageQueue } = this.container;

        if (message.author.id === client.user?.id) return;
        if (!message.guild) return;
        if (message.channel.type !== ChannelType.GuildText) return;

        const stickyData = await this.getStickyMessage(message.guild.id, message.channelId);
        if (!stickyData) return;

        const timeoutId = `${message.guild.id}.${message.channelId}`;
        if (stickyMessageTimeouts.has(timeoutId)) {
            clearTimeout(stickyMessageTimeouts.get(timeoutId)!);
        }

        // early checking to prevent duplicate messages
        if (stickyMessageQueue.has(timeoutId)) {
            this.container.logger.info(`Sticky message already in queue: ${timeoutId}`);
            return;
        }

        // early adding to prevent duplicate messages
        stickyMessageQueue.add(timeoutId);

        const timeout = setTimeout(async () => {
            await this.handleStickyMessage(message.channel as TextChannel, stickyData, timeoutId);
        }, 1000);

        stickyMessageTimeouts.set(timeoutId, timeout);
    }

    private async getStickyMessage(guildId: string, channelId: string) {
        return db.query.stickyMessages.findFirst({
            where: and(eq(stickyMessages.guildId, guildId), eq(stickyMessages.channelId, channelId)),
        });
    }

    private async handleStickyMessage(
        channel: TextChannel,
        stickyData: typeof stickyMessages.$inferSelect,
        queueId: string,
    ) {
        const { stickyMessageQueue } = this.container;

        try {
            const latestSticky = await this.getStickyMessage(stickyData.guildId, stickyData.channelId);
            if (!latestSticky) return;

            const [, oldMessage] = await safeAwait(channel.messages.fetch(latestSticky.lastMessageId!));

            if (oldMessage) {
                await oldMessage.delete();
            }

            const newMessage = await channel.send(stickyData.message);

            await db
                .update(stickyMessages)
                .set({ lastMessageId: newMessage.id })
                .where(eq(stickyMessages.id, stickyData.id));
        } catch (error) {
            this.container.logger.error(error);
        } finally {
            stickyMessageQueue.delete(queueId);
            if (stickyMessageTimeouts.has(queueId)) {
                clearTimeout(stickyMessageTimeouts.get(queueId)!);
                stickyMessageTimeouts.delete(queueId);
            }
        }
    }
}
