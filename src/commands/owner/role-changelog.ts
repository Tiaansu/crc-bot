import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Command, type Awaitable } from '@sapphire/framework';
import { oneLineCommaListsAnd } from 'common-tags';
import {
    ActionRowBuilder,
    ApplicationCommandType,
    MessageFlags,
    PermissionFlagsBits,
    roleMention,
    RoleSelectMenuBuilder,
} from 'discord.js';

@ApplyOptions<Command.Options>({
    preconditions: ['BotOwnerOnly'],
    requiredClientPermissions: [PermissionFlagsBits.ManageRoles],
    requiredUserPermissions: [PermissionFlagsBits.Administrator],
})
export class BotCommand extends Command {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry): Awaitable<void> {
        registry.registerContextMenuCommand((builder) =>
            builder.setName('Roles Changelog').setType(ApplicationCommandType.Message),
        );
    }

    public override async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
        if (!interaction.isMessageContextMenuCommand()) return;

        const message = interaction.targetMessage;
        if (message.author.id !== this.container.client.user?.id) {
            return await interaction.reply({
                content: 'The message is not sent by the bot (me).',
                flags: MessageFlags.Ephemeral,
            });
        }

        const content = message.content
            .split('\n')
            .filter((item) => item.length > 0 && item !== '||@here||')
            .map((item) => (item.startsWith('>') && !item.startsWith('> -') && `\n${item}`) || item);

        const selectMenu = new RoleSelectMenuBuilder()
            .setMinValues(0)
            .setMaxValues(24)
            .setCustomId('changelog-roles-select-menu')
            .setPlaceholder('Select roles...');
        const row = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(selectMenu);

        const reply = await interaction.reply({
            content: 'Please select roles that have been added',
            flags: MessageFlags.Ephemeral,
            components: [row],
            withResponse: true,
        });

        try {
            const collected = await reply.resource?.message?.awaitMessageComponent({
                filter: (i) => i.user.id === interaction.user.id,
                time: 60_000,
            });

            if (collected?.customId === 'changelog-roles-select-menu' && collected.isRoleSelectMenu()) {
                const mentionSelected = collected.values.map((id) => roleMention(id));

                const dateNow = new Date().toLocaleDateString('en-PH', {
                    timeZone: 'Asia/Manila',
                });

                content.push(`\n> ${dateNow}`);
                content.push(`> - Added ${oneLineCommaListsAnd`${mentionSelected}`}`);
                content.push(`\n||@here||`);

                await message.edit({
                    content: content.join('\n'),
                    allowedMentions: {
                        parse: ['everyone'],
                    },
                });

                await collected.update({
                    content: oneLineCommaListsAnd`${mentionSelected}`,
                    components: [],
                });
            }
        } catch {
            await interaction.editReply({
                content: 'Timeout.',
                components: [],
            });
        }

        return;
    }
}
