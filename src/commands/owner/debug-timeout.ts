import { ApplyOptions } from '@sapphire/decorators';
import { Command, type ApplicationCommandRegistry, type Awaitable } from '@sapphire/framework';
import { GuildMember, MessageFlags, PermissionFlagsBits } from 'discord.js';

@ApplyOptions<Command.Options>({
    name: 'debug-timeout',
    description: 'Debug timeout command',
    preconditions: ['BotOwnerOnly'],
    requiredClientPermissions: [PermissionFlagsBits.ModerateMembers],
    requiredUserPermissions: [PermissionFlagsBits.ModerateMembers],
})
export class BotCommand extends Command {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry): Awaitable<void> {
        registry.registerChatInputCommand(
            (builder) =>
                builder
                    .setName(this.name)
                    .setDescription(this.description)
                    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
                    .addUserOption((option) =>
                        option.setName('member').setDescription('The member to timeout').setRequired(true),
                    )
                    .addNumberOption((option) =>
                        option
                            .setName('time')
                            .setDescription('The time to timeout the user (seconds)')
                            .setRequired(true),
                    ),
            {
                guildIds: ['1025336952381263882'],
            },
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const member = interaction.options.getMember('member');
        const time = interaction.options.getNumber('time', true);

        if (!member) {
            return;
        }

        await (member as GuildMember).timeout(time * 1_000, `Debug timeout by ${interaction.user.tag}`);
        return await interaction.reply({
            content: 'Timeout successful',
            flags: MessageFlags.Ephemeral,
        });
    }
}
