import { db } from '@/lib/db';
import { offenses } from '@/lib/db/schema';
import { isFlaggedForShutdown } from '@/utils/flag-for-shutdown';
import { safeAwait } from '@/utils/safe-await';
import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { envParseString } from '@skyra/env-utilities';
import { MessageType, type Message } from 'discord.js';
import { eq } from 'drizzle-orm';

@ApplyOptions<Listener.Options>({
    event: Events.MessageCreate,
})
export class BotListener extends Listener {
    #MUTE_MINUTES: number = 10; // default

    public async run(message: Message) {
        if (isFlaggedForShutdown()) return;

        if (message.author.bot) return;
        if (message.channel.id !== this.container.config.tradingChannelId)
            return;
        if (!message.channel.isSendable()) return;
        if (!message.member) return;

        const { id: userId } = message.author;
        if (
            envParseString('NODE_ENV') !== 'development' &&
            this.container.config.serverAdminIds.includes(userId)
        ) {
            return;
        }

        const mentions = message.mentions.users.filter(
            (m) => m.id !== userId && !m.bot,
        );
        const [, reference] = await safeAwait(message.fetchReference());
        if (
            mentions.size === 0 &&
            (!reference || message.type !== MessageType.Reply)
        ) {
            return;
        }

        const offensesDb = await db.query.offenses.findFirst({
            where: eq(offenses.userId, userId),
        });

        const offenseCount = (offensesDb?.currentOffense || 0) + 1;

        const minute = offenseCount * this.#MUTE_MINUTES;

        const text =
            message.type === MessageType.Reply || mentions.size === 0
                ? `Hi, ${message.author}, you have been muted for ${minute} minutes for replying to a message in the trading channel. Current offense: ${offenseCount}`
                : `Hi, ${message.author}, you have been muted for ${minute} minutes for mentioning someone in the trading channel. Current offense: ${offenseCount}`;

        const promises: Promise<unknown>[] = [
            message.delete(),
            message.channel.send(text),
            offensesDb
                ? db
                      .update(offenses)
                      .set({
                          currentOffense: offenseCount,
                      })
                      .where(eq(offenses.userId, userId))
                : db.insert(offenses).values({
                      userId,
                      currentOffense: 1,
                  }),
        ];

        if (message.author.id !== message.guild?.ownerId) {
            promises.push(
                message.member.timeout(
                    minute * 60 * 1_000,
                    message.type === MessageType.Reply || mentions.size === 0
                        ? 'Replying to a message in the trading channel'
                        : 'Mentioning someone in the trading channel',
                ),
            );
        }

        await Promise.all(promises);
    }
}
