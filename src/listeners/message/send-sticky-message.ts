import { db } from '@/lib/db';
import { stickyMessages } from '@/lib/db/schema';
import { safeAwait } from '@/utils/safe-await';
import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { ChannelType, type Message, type TextChannel } from 'discord.js';
import { and, eq } from 'drizzle-orm';

@ApplyOptions<Listener.Options>({
    event: Events.MessageCreate,
})
export class BotListener extends Listener {
    public async run(message: Message) {
        const { stickyMessageTimeouts } = this.container;

        if (message.author.bot) return;
        if (!message.guild) return;
        if (message.channel.type !== ChannelType.GuildText) return;

        const stickyData = await this.getStickyMessage(message.guild.id, message.channelId);
        if (!stickyData) return;

        const timeoutId = `${message.guild.id}.${message.channelId}`;
        if (stickyMessageTimeouts.has(timeoutId)) {
            clearTimeout(stickyMessageTimeouts.get(timeoutId)!);
        }

        const timeout = setTimeout(async () => {
            await this.handleStickyMessage(message.channel as TextChannel, stickyData);
        }, 1000);

        stickyMessageTimeouts.set(timeoutId, timeout);
    }

    private async getStickyMessage(guildId: string, channelId: string) {
        return db.query.stickyMessages.findFirst({
            where: and(eq(stickyMessages.guildId, guildId), eq(stickyMessages.channelId, channelId)),
        });
    }

    private async handleStickyMessage(channel: TextChannel, stickyData: typeof stickyMessages.$inferSelect) {
        const [, oldMessage] = await safeAwait(channel.messages.fetch(stickyData.lastMessageId!));

        const result = await Promise.all(
            oldMessage ? [oldMessage.delete(), channel.send(stickyData.message)] : [channel.send(stickyData.message)],
        );

        const newMessageId = result?.[oldMessage ? 1 : 0]?.id;
        if (!newMessageId) return;

        await db
            .update(stickyMessages)
            .set({ lastMessageId: newMessageId })
            .where(eq(stickyMessages.id, stickyData.id));
    }
}
