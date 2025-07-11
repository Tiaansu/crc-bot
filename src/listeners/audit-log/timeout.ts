import { safeAwait } from '@/utils/safe-await';
import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { stripIndents } from 'common-tags';
import {
    AuditLogEvent,
    bold,
    EmbedBuilder,
    time,
    type Guild,
    type GuildAuditLogsEntry,
} from 'discord.js';

@ApplyOptions<Listener.Options>({
    event: Events.GuildAuditLogEntryCreate,
    name: 'timeout-handler',
})
export class BotListener extends Listener<
    typeof Events.GuildAuditLogEntryCreate
> {
    public async run(auditLogEntry: GuildAuditLogsEntry, guild: Guild) {
        const { client } = this.container;
        const { action, executorId, targetId, changes, reason } = auditLogEntry;

        if (action !== AuditLogEvent.MemberUpdate || !executorId || !targetId) {
            return;
        }

        const [[, executor], [, target]] = await Promise.all([
            safeAwait(client.users.fetch(executorId)),
            safeAwait(client.users.fetch(targetId)),
        ]);

        if (!executor || !target) return;

        const [, targetDm] = await safeAwait(target.createDM(true));
        if (!targetDm) return;

        for (const change of changes) {
            if (change.key !== 'communication_disabled_until') continue;

            const { new: newValue, old: oldValue } = change;

            if (!newValue && oldValue) {
                // Remove timeout
                const embed = new EmbedBuilder()
                    .setAuthor({
                        iconURL: guild.iconURL() ?? undefined,
                        name: guild.name,
                    })
                    .setTitle('You have been unmuted')
                    .setDescription(
                        stripIndents`
                            ${bold('Admin')}: ${executor.displayName}
                        `,
                    )
                    .setColor('Yellow')
                    .setTimestamp();

                await safeAwait(targetDm.send({ embeds: [embed] }));
            } else if (!oldValue && newValue) {
                // Add timeout
                const timestamp = Math.floor(
                    new Date(newValue).getTime() / 1000,
                );

                const embed = new EmbedBuilder()
                    .setAuthor({
                        iconURL: guild.iconURL() ?? undefined,
                        name: guild.name,
                    })
                    .setTitle('You have been muted')
                    .setDescription(
                        stripIndents`
                            ${bold('Admin')}: ${executor.displayName}
                            ${bold('Reason')}: ${reason ?? 'No reason provided'}
                            ${bold('Until')}: ${time(timestamp)} (${time(timestamp, 'R')})
                        `,
                    )
                    .setColor('Red')
                    .setTimestamp();

                await safeAwait(targetDm.send({ embeds: [embed] }));
            }
        }
    }
}
