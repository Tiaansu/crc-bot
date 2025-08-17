import { db } from '@/lib/db';
import { stickyMessages } from '@/lib/db/schema';
import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { ChannelType, DiscordAPIError, RESTJSONErrorCodes, type Message, type TextChannel } from 'discord.js';
import { and, eq } from 'drizzle-orm';

@ApplyOptions<Listener.Options>({
    event: Events.MessageCreate,
})
export class BotListener extends Listener {
    public async run(message: Message) {
        const { stickyMessageTimeouts, stickyMessageLock, client } = this.container;

        if (message.author.id === client.user?.id) return;
        if (!message.guild) return;
        if (message.channel.type !== ChannelType.GuildText) return;

        const stickyData = await this.getStickyMessage(message.guild.id, message.channelId);
        if (!stickyData) return;

        const lockId = `${message.guild.id}.${message.channelId}`;

        const prevLock = stickyMessageLock.get(lockId) ?? Promise.resolve();

        const newLock = prevLock.then(async () => {
            if (stickyMessageTimeouts.has(lockId)) {
                clearTimeout(stickyMessageTimeouts.get(lockId));
            }

            await new Promise<void>((resolve) => {
                const timeout = setTimeout(async () => {
                    try {
                        await this.handleStickyMessage(message.channel as TextChannel, stickyData);
                    } finally {
                        resolve();
                    }
                }, 7500);

                stickyMessageTimeouts.set(lockId, timeout);
            });
        });

        stickyMessageLock.set(lockId, newLock);
    }

    private async getStickyMessage(guildId: string, channelId: string) {
        return db.query.stickyMessages.findFirst({
            where: and(eq(stickyMessages.guildId, guildId), eq(stickyMessages.channelId, channelId)),
        });
    }

    private async handleStickyMessage(channel: TextChannel, stickyData: typeof stickyMessages.$inferSelect) {
        try {
            const latestSticky = await this.getStickyMessage(stickyData.guildId, stickyData.channelId);
            if (!latestSticky) return;

            if (latestSticky.lastMessageId) {
                try {
                    const oldMessage = await channel.messages.fetch(latestSticky.lastMessageId);
                    await oldMessage.delete();
                } catch (error) {
                    if (error instanceof DiscordAPIError && error.code === RESTJSONErrorCodes.UnknownMessage) {
                        this.container.logger.info(`Sticky message ${latestSticky.lastMessageId} was already deleted.`);
                    } else {
                        throw error;
                    }
                }
            }

            const newMessage = await channel.send(stickyData.message);

            await db
                .update(stickyMessages)
                .set({ lastMessageId: newMessage.id })
                .where(eq(stickyMessages.id, stickyData.id));
        } catch (error) {
            this.container.logger.error(error);
        }
    }
}
