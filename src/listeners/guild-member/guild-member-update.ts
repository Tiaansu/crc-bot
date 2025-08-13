import { safeAwait } from '@/utils/safe-await';
import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { stripIndents } from 'common-tags';
import { AuditLogEvent, bold, EmbedBuilder, inlineCode, time, type GuildMember } from 'discord.js';

@ApplyOptions<Listener.Options>({
    event: Events.GuildMemberUpdate,
    name: 'timeout-logger',
})
export class BotListener extends Listener<typeof Events.GuildMemberUpdate> {
    public async run(oldMember: GuildMember, newMember: GuildMember) {
        if (
            oldMember.communicationDisabledUntilTimestamp === newMember.communicationDisabledUntilTimestamp ||
            (newMember.communicationDisabledUntilTimestamp ?? Number.POSITIVE_INFINITY) < Date.now()
        ) {
            return;
        }

        const auditLogs = await oldMember.guild.fetchAuditLogs({
            limit: 10,
            type: AuditLogEvent.MemberUpdate,
        });
        const logs = auditLogs.entries.find(
            (log) =>
                log.target!.id === oldMember.user.id &&
                log.changes.some((change) => change.key === 'communication_disabled_until'),
        );

        if (!logs?.changes) {
            this.container.logger.warn(`logs.changes is undefined or empty`);
            return;
        }

        const timeoutChange = logs.changes.find((change) => change.key === 'communication_disabled_until');

        if (!timeoutChange) {
            this.container.logger.warn(`timeoutChange is undefined or empty`);
            return;
        }

        const timeoutEnded = Boolean(timeoutChange.old && !timeoutChange.new);

        const [, targetDm] = await safeAwait(oldMember.user?.createDM(true));
        const [, logChannel] = await safeAwait(oldMember.guild.channels.fetch(this.container.config.logsChannelId));

        if (!targetDm || !logChannel || !logChannel.isSendable()) {
            this.container.logger.warn(`targetDm is undefined, logChannel is undefined, or logChannel is not sendable`);
            return;
        }

        const baseEmbed = new EmbedBuilder()
            .setAuthor({
                iconURL: oldMember.guild.iconURL() ?? undefined,
                name: oldMember.guild.name,
            })
            .setTimestamp();

        if (!logs.executor) return;

        const promises: Promise<any>[] = [];

        if (timeoutEnded) {
            const userEmbed = EmbedBuilder.from(baseEmbed)
                .setTitle('You have been unmuted')
                .setDescription(
                    stripIndents`
                        ${bold('Admin')}: ${logs.executor.displayName}
                    `,
                )
                .setColor('Yellow');

            const logEmbed = EmbedBuilder.from(baseEmbed)
                .setTitle('User has been unmuted')
                .setDescription(
                    stripIndents`
                        ${bold('Admin')}: ${inlineCode(logs.executor.displayName)} (${logs.executor.id})
                    `,
                )
                .setColor('Yellow');

            promises.push(safeAwait(logChannel.send({ embeds: [logEmbed] })));
            promises.push(safeAwait(targetDm.send({ embeds: [userEmbed] })));
        } else {
            const timestamp = Math.floor((newMember.communicationDisabledUntilTimestamp ?? Date.now()) / 1000);

            const userEmbed = EmbedBuilder.from(baseEmbed)
                .setTitle('You have been muted')
                .setDescription(
                    stripIndents`
                        ${bold('Admin')}: ${logs.executor.displayName}
                        ${bold('Reason')}: ${logs.reason ?? 'No reason provided'}
                        ${bold('Until')}: ${time(timestamp)} (${time(timestamp, 'R')})
                    `,
                )
                .setColor('Red');

            const logEmbed = EmbedBuilder.from(baseEmbed)
                .setTitle('User has been muted')
                .setDescription(
                    stripIndents`
                        ${bold('Admin')}: ${inlineCode(logs.executor.displayName)} (${logs.executor.id})
                        ${bold('User')}: ${inlineCode(oldMember.user.displayName)} (${oldMember.user.id})
                        ${bold('Reason')}: ${logs.reason ?? 'No reason provided'}
                        ${bold('Until')}: ${time(timestamp)} (${time(timestamp, 'R')})
                    `,
                )
                .setColor('Red');

            promises.push(safeAwait(logChannel.send({ embeds: [logEmbed] })));
            promises.push(safeAwait(targetDm.send({ embeds: [userEmbed] })));
        }

        await Promise.all(promises);
    }
}
