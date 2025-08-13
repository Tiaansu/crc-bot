import { isFlaggedForShutdown } from '@/utils/flag-for-shutdown';
import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';

@ApplyOptions<Listener.Options>({
    event: Events.MessageCreate,
})
export class BotListener extends Listener {
    #EMOJIES = {
        Win: '✅',
        Fair: '⚖️',
        Lose: '❌',
    };

    public async run(message: Message) {
        if (isFlaggedForShutdown()) return;

        if (message.author.bot) return;
        if (message.channel.id !== this.container.config.wflLoungeChannelId) return;

        setTimeout(async () => {
            await Promise.all([
                message.react(this.#EMOJIES.Win),
                message.react(this.#EMOJIES.Fair),
                message.react(this.#EMOJIES.Lose),
            ]);
        }, 1000 /* Adding delay for testing purposes... */);
    }
}
