import { db } from '@/lib/db';
import { stickyMessages } from '@/lib/db/schema';
import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Command, type Awaitable } from '@sapphire/framework';
import { ChannelType, inlineCode, MessageFlags, PermissionFlagsBits, TextChannel } from 'discord.js';
import { eq } from 'drizzle-orm';

@ApplyOptions<Command.Options>({
    name: 'sticky-message',
    description: 'A command to create sticky messages',
    preconditions: ['GuildOnly', 'BotOwnerOnly'],
    requiredClientPermissions: [
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
    ],
    requiredUserPermissions: [PermissionFlagsBits.ManageMessages],
})
export class BotCommand extends Command {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry): Awaitable<void> {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
                .addChannelOption((option) =>
                    option
                        .setName('channel')
                        .setDescription('The channel to create the sticky message in')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText),
                ),
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const channel = interaction.options.getChannel<ChannelType.GuildText>('channel', true);

        const existingStickyMessage = await db.query.stickyMessages.findFirst({
            where: eq(stickyMessages.channelId, channel.id),
            columns: {
                id: true,
            },
        });

        if (existingStickyMessage) {
            return interaction.reply({
                content: `There is already a sticky message in this channel. ID: ${inlineCode(existingStickyMessage.id)}`,
                flags: MessageFlags.Ephemeral,
            });
        }

        const message = await interaction.reply({
            content: 'Please enter the message you want to make sticky.',
            flags: MessageFlags.Ephemeral,
            withResponse: true,
        });

        try {
            const collected = await (message.resource?.message?.channel as TextChannel).awaitMessages({
                filter: (m) => !m.author.bot && m.author.id === interaction.user.id,
                max: 1,
                time: 30 * 1000, // 30 seconds in milliseconds,
                errors: ['time'],
            });

            await interaction.followUp({
                content: `Alright, your sticky message is:\n\n${collected.first()?.content}`,
                flags: MessageFlags.Ephemeral,
            });

            const content = collected.first()?.content || '';
            const [{ id }] = await db
                .insert(stickyMessages)
                .values({
                    guildId: interaction.guild?.id!,
                    channelId: channel.id,
                    message: content,
                })
                .returning({ id: stickyMessages.id });

            const stickyMessage = await channel.send(content);
            await db.update(stickyMessages).set({ lastMessageId: stickyMessage.id }).where(eq(stickyMessages.id, id));
        } catch (error) {
            this.container.logger.error(error);
            interaction.followUp({
                content: 'Something went wrong or you took too long to respond.',
                flags: MessageFlags.Ephemeral,
            });
        }
        return;
    }
}
