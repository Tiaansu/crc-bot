import { isFlaggedForShutdown } from '@/utils/flag-for-shutdown';
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
        if (isFlaggedForShutdown()) return;

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
        const [, logChannel] = await safeAwait(
            guild.channels.fetch(this.container.config.logsChannelId),
        );
        if (!targetDm || !logChannel || !logChannel.isSendable()) return;

        for (const change of changes) {
            if (change.key !== 'communication_disabled_until') continue;

            const { new: newValue, old: oldValue } = change;

            const baseEmbed = new EmbedBuilder()
                .setAuthor({
                    iconURL: guild.iconURL() ?? undefined,
                    name: guild.name,
                })
                .setTimestamp();

            if (!newValue && oldValue) {
                // Remove timeout

                baseEmbed
                    .setDescription(
                        stripIndents`
                            ${bold('Admin')}: ${executor.displayName}
                        `,
                    )
                    .setColor('Yellow');

                const embed = baseEmbed.setTitle('You have been unmuted');
                const logEmbed = baseEmbed
                    .setTitle('Timeout removed')
                    .setDescription(
                        stripIndents`
                            ${bold('Admin')}: ${executor.displayName} (${executor.id})
                            ${bold('User')}: ${target.displayName} (${target.id})
                        `,
                    );

                await Promise.all([
                    safeAwait(logChannel.send({ embeds: [logEmbed] })),
                    safeAwait(targetDm.send({ embeds: [embed] })),
                ]);
            } else if (!oldValue && newValue) {
                // Add timeout
                const timestamp = Math.floor(
                    new Date(newValue).getTime() / 1000,
                );

                baseEmbed
                    .setDescription(
                        stripIndents`
                            ${bold('Admin')}: ${executor.displayName}
                            ${bold('Reason')}: ${reason ?? 'No reason provided'}
                            ${bold('Until')}: ${time(timestamp)} (${time(timestamp, 'R')})
                        `,
                    )
                    .setColor('Red');

                const embed = baseEmbed.setTitle('You have been muted');
                const logEmbed = baseEmbed
                    .setTitle('Timeout added')
                    .setDescription(
                        stripIndents`
                            ${bold('Admin')}: ${executor.displayName} (${executor.id})
                            ${bold('User')}: ${target.displayName} (${target.id})
                            ${bold('Reason')}: ${reason ?? 'No reason provided'}
                            ${bold('Until')}: ${time(timestamp)} (${time(timestamp, 'R')})
                        `,
                    )
                    .setColor('Red');

                await Promise.all([
                    safeAwait(logChannel.send({ embeds: [logEmbed] })),
                    safeAwait(targetDm.send({ embeds: [embed] })),
                ]);
            }
        }
    }
}
