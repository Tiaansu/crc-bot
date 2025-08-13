import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Command, type Awaitable } from '@sapphire/framework';
import { MediaGalleryBuilder, MediaGalleryItemBuilder, MessageFlags, PermissionFlagsBits } from 'discord.js';

@ApplyOptions<Command.Options>({
    name: 'debug',
    description: 'A debug command',
    preconditions: ['BotOwnerOnly'],
    requiredClientPermissions: [PermissionFlagsBits.ManageRoles],
    requiredUserPermissions: [PermissionFlagsBits.ManageRoles | PermissionFlagsBits.Administrator],
})
export class BotCommand extends Command {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry): Awaitable<void> {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles | PermissionFlagsBits.Administrator),
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const media = new MediaGalleryBuilder();
        media.addItems([new MediaGalleryItemBuilder().setURL('https://avatars.githubusercontent.com/u/87069680?v=4')]);

        this.container.logger.debug(JSON.stringify(media.toJSON()));

        return await interaction.reply({
            components: [media],
            flags: MessageFlags.IsComponentsV2,
        });
    }
}
