import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { userMention, type Message } from 'discord.js';

@ApplyOptions<Listener.Options>({
    event: Events.MessageCreate,
})
export class BotListener extends Listener {
    private readonly MESSAGE_COUNT = 10;
    private lastUserMessageIndex = new Map<string, number>();
    private globalMessagesCount = 0;

    public async run(message: Message) {
        if (message.author.bot) return;
        if (message.channel.id !== this.container.config.tradingChannelId)
            return;
        if (!message.channel.isSendable()) return;

        const { id: userId } = message.author;
        const lastIndex = this.lastUserMessageIndex.get(userId);

        if (lastIndex === undefined) {
            this.updateGlobalMessageCount(userId);
            return;
        }

        if (
            this.globalMessagesCount &&
            this.globalMessagesCount - lastIndex < this.MESSAGE_COUNT
        ) {
            const [, msg] = await Promise.all([
                message.delete(),
                message.channel.send(
                    `${userMention(userId)} wait until ${this.MESSAGE_COUNT - (this.globalMessagesCount - lastIndex)} more messages before sending your message.`,
                ),
            ]);

            setTimeout(
                () => msg.delete().catch(this.container.logger.error),
                3000,
            );
            return;
        }

        this.updateGlobalMessageCount(userId);
    }

    private updateGlobalMessageCount(userId: string) {
        this.globalMessagesCount++;
        this.lastUserMessageIndex.set(userId, this.globalMessagesCount);
    }
}
