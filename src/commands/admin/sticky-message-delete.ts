import { db } from '@/lib/db';
import { stickyMessages } from '@/lib/db/schema';
import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Command, type Awaitable } from '@sapphire/framework';
import { MessageFlags, PermissionFlagsBits } from 'discord.js';
import { eq } from 'drizzle-orm';

@ApplyOptions<Command.Options>({
    name: 'sticky-message-delete',
    description: 'Delete a sticky message',
    preconditions: ['GuildOnly', 'BotOwnerOnly'],
    requiredClientPermissions: [PermissionFlagsBits.ManageMessages],
    requiredUserPermissions: [PermissionFlagsBits.ManageMessages],
})
export class BotCommand extends Command {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry): Awaitable<void> {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
                .addStringOption((option) =>
                    option.setName('id').setDescription('The id of the sticky message to delete').setRequired(true),
                ),
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const id = interaction.options.getString('id', true);

        const deleted = await db.delete(stickyMessages).where(eq(stickyMessages.id, id)).returning();

        if (deleted.length === 0) {
            return interaction.reply({
                content: 'No sticky message found with that id.',
                flags: MessageFlags.Ephemeral,
            });
        }

        return interaction.reply({ content: 'Deleted sticky message.', flags: MessageFlags.Ephemeral });
    }
}
