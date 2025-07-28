import { safeAwait } from '@/utils/safe-await';
import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';

@ApplyOptions<Listener.Options>({
    event: Events.MessageCreate,
})
export class BotListener extends Listener {
    public async run(message: Message) {
        if (message.author.bot) return;
        if (message.channel.id !== this.container.config.tradingChannelId)
            return;
        if (!message.channel.isSendable()) return;
        if (!message.member) return;

        const { id: userId } = message.author;
        if (this.container.config.serverAdminIds.includes(userId)) return;

        const [, reference] = await safeAwait(message.fetchReference());
        if (!reference) return;

        await Promise.all([
            message.member.timeout(10 * 60 * 10_000), // 10 minutes
            message.reply({
                content:
                    'You have been muted for 10 minutes for sending a reply to a message in the trading channel.',
            }),
        ]);
    }
}
