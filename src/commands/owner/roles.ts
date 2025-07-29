import { isFlaggedForShutdown } from '@/utils/flag-for-shutdown';
import { ApplyOptions } from '@sapphire/decorators';
import {
    ApplicationCommandRegistry,
    Command,
    type Awaitable,
} from '@sapphire/framework';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MessageFlags,
    PermissionFlagsBits,
} from 'discord.js';

@ApplyOptions<Command.Options>({
    name: 'roles',
    description: 'A command to manage roles.',
    preconditions: ['BotOwnerOnly'],
    requiredClientPermissions: [PermissionFlagsBits.ManageRoles],
    requiredUserPermissions: [
        PermissionFlagsBits.ManageRoles | PermissionFlagsBits.Administrator,
    ],
})
export class BotCommand extends Command {
    public override registerApplicationCommands(
        registry: ApplicationCommandRegistry,
    ): Awaitable<void> {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDefaultMemberPermissions(
                    PermissionFlagsBits.ManageRoles |
                        PermissionFlagsBits.Administrator,
                ),
        );
    }

    public override async chatInputRun(
        interaction: Command.ChatInputCommandInteraction,
    ) {
        if (isFlaggedForShutdown()) return;

        const createBtn = new ButtonBuilder()
            .setCustomId('role-config-create')
            .setLabel('Create')
            .setStyle(ButtonStyle.Success);
        const editBtn = new ButtonBuilder()
            .setCustomId('role-config-edit')
            .setLabel('Edit')
            .setStyle(ButtonStyle.Primary);
        const deleteBtn = new ButtonBuilder()
            .setCustomId('role-config-delete')
            .setLabel('Delete')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
            createBtn,
            editBtn,
            deleteBtn,
        );

        const embed = new EmbedBuilder()
            .setTitle('Roles Config')
            .setDescription('Choose an option from the menu below.');

        return await interaction.reply({
            embeds: [embed],
            components: [row],
            flags: MessageFlags.Ephemeral,
        });
    }
}
