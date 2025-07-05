import { rolesToCreate } from '@/lib/data/roles';
import { db } from '@/lib/db';
import { channels, rolePickers, roles } from '@/lib/db/schema';
import { gagCategories } from '@/utils/constants';
import { ApplyOptions } from '@sapphire/decorators';
import type {
    ApplicationCommandRegistry,
    Awaitable,
} from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { stripIndents } from 'common-tags';
import {
    ActionRowBuilder,
    bold,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    Colors,
    EmbedBuilder,
    inlineCode,
    PermissionFlagsBits,
} from 'discord.js';
import { eq } from 'drizzle-orm';

@ApplyOptions<Subcommand.Options>({
    name: 'setup',
    description: 'A command to setup the bot in the server.',
    subcommands: [
        {
            name: 'roles',
            chatInputRun: 'chatInputRunRoles',
            preconditions: ['GuildOnly', 'EphemeralDefer'],
            requiredUserPermissions: PermissionFlagsBits.Administrator,
        },
        {
            name: 'channels',
            chatInputRun: 'chatInputRunChannels',
            preconditions: ['GuildOnly', 'EphemeralDefer'],
            requiredUserPermissions: PermissionFlagsBits.Administrator,
        },
        {
            name: 'role-picker',
            type: 'group',
            entries: [
                {
                    name: 'create',
                    chatInputRun: 'chatInputRunRolePickerCreate',
                    preconditions: ['GuildOnly', 'EphemeralDefer'],
                    requiredUserPermissions: PermissionFlagsBits.Administrator,
                },
            ],
        },
    ],
})
export class BotCommand extends Subcommand {
    public override registerApplicationCommands(
        registry: ApplicationCommandRegistry,
    ): Awaitable<void> {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addSubcommand((command) =>
                    command
                        .setName('roles')
                        .setDescription(
                            'Setup roles for the bot in the server.',
                        ),
                )
                .addSubcommand((command) =>
                    command
                        .setName('channels')
                        .setDescription(
                            'Setup channels for the bot in the server.',
                        )
                        .addChannelOption((option) =>
                            option
                                .setName('stock')
                                .setDescription('The stock channel.')
                                .addChannelTypes(ChannelType.GuildText),
                        )
                        .addChannelOption((option) =>
                            option
                                .setName('egg')
                                .setDescription('The egg stock channel.')
                                .addChannelTypes(ChannelType.GuildText),
                        )
                        .addChannelOption((option) =>
                            option
                                .setName('cosmetic')
                                .setDescription('The cosmetic stock channel.')
                                .addChannelTypes(ChannelType.GuildText),
                        )
                        .addChannelOption((option) =>
                            option
                                .setName('weather')
                                .setDescription('The weather channel.')
                                .addChannelTypes(ChannelType.GuildText),
                        )
                        .addChannelOption((option) =>
                            option
                                .setName('event')
                                .setDescription('The event stock channel.')
                                .addChannelTypes(ChannelType.GuildText),
                        )
                        .addChannelOption((option) =>
                            option
                                .setName('jandel-message')
                                .setDescription('The jandel message channel.')
                                .addChannelTypes(ChannelType.GuildText),
                        )
                        .addChannelOption((option) =>
                            option
                                .setName('traveling-merchant')
                                .setDescription(
                                    'The traveling merchant channel.',
                                )
                                .addChannelTypes(ChannelType.GuildText),
                        ),
                )
                .addSubcommandGroup((group) =>
                    group
                        .setName('role-picker')
                        .setDescription('Role picker command group')
                        .addSubcommand((command) =>
                            command
                                .setName('create')
                                .setDescription(
                                    'Setup role pickers for the bot in the server.',
                                )
                                .addChannelOption((option) =>
                                    option
                                        .setName('channel')
                                        .setDescription(
                                            'The channel to setup role pickers in.',
                                        )
                                        .addChannelTypes(ChannelType.GuildText)
                                        .setRequired(true),
                                ),
                        ),
                ),
        );
    }

    public async chatInputRunRoles(
        interaction: Subcommand.ChatInputCommandInteraction,
    ) {
        await interaction.editReply(
            'Please wait as the roles are being created...',
        );

        const guildRoles = await interaction.guild?.roles.fetch()!;
        const guildRolesNames = new Set(guildRoles.map((role) => role.name));

        const rolesToBeCreated = [];

        for (const value of rolesToCreate) {
            if (guildRolesNames.has(value.name)) continue;

            rolesToBeCreated.push(
                interaction.guild?.roles.create({
                    name: value.name,
                    color: value.color,
                    reason: 'Bot setup',
                })!,
            );
        }

        const results = await Promise.all(rolesToBeCreated);

        const toDb = [];

        for (const role of results) {
            const item = Object.values(rolesToCreate).find(
                (item) => item.name === role.name,
            );
            if (!item) continue;
            toDb.push(
                db.insert(roles).values({
                    guildId: interaction.guildId!,
                    roleId: role.id,
                    forItem: item.itemId,
                    forType: item.type,
                }),
            );
        }

        await Promise.all(toDb);
        return await interaction.editReply('Roles created.');
    }

    public async chatInputRunChannels(
        interaction: Subcommand.ChatInputCommandInteraction,
    ) {
        await Promise.all([
            this.insertToChannelTable(interaction, 'stock', 'stock'),
            this.insertToChannelTable(interaction, 'egg', 'egg'),
            this.insertToChannelTable(interaction, 'cosmetic', 'cosmetic'),
            this.insertToChannelTable(interaction, 'weather', 'weather'),
            this.insertToChannelTable(interaction, 'event', 'event'),
            this.insertToChannelTable(
                interaction,
                'jandel-message',
                'notification',
            ),
            this.insertToChannelTable(
                interaction,
                'traveling-merchant',
                'travelingmerchant',
            ),
        ]);

        return await interaction.editReply(`Completed channel setup.`);
    }

    private async insertToChannelTable(
        interaction: Subcommand.ChatInputCommandInteraction,
        name: string,
        forType: string,
    ) {
        const channel = this.getChannel(interaction, name);
        if (!channel) return null;

        const webhook = await channel.createWebhook({
            name: 'CRC Bot - Notifier',
            avatar: this.container.client.user?.avatarURL()!,
        });

        return db.insert(channels).values({
            guildId: interaction.guildId!,
            webhookUrl: webhook.url,
            forType,
        });
    }

    private getChannel(
        interaction: Subcommand.ChatInputCommandInteraction,
        name: string,
        required: boolean = false,
    ) {
        return interaction.options.getChannel(name, required, [
            ChannelType.GuildText,
        ]);
    }

    public async chatInputRunRolePickerCreate(
        interaction: Subcommand.ChatInputCommandInteraction,
    ) {
        const rolePicker = await db.query.rolePickers.findFirst({
            where: eq(rolePickers.guildId, interaction.guildId!),
        });

        if (rolePicker) {
            const channel = await interaction.guild?.channels.fetch(
                rolePicker.channelId,
            );
            if (channel && channel.type === ChannelType.GuildText) {
                const message = await channel.messages.fetch(
                    rolePicker.messageId,
                );
                if (message) {
                    return await interaction.editReply(
                        `Role picker already exists at ${message.url}. Run ${inlineCode('/setup role-picker delete')} to delete it.`,
                    );
                } else {
                    await db
                        .delete(rolePickers)
                        .where(eq(rolePickers.guildId, interaction.guildId!));
                }
            } else {
                await db
                    .delete(rolePickers)
                    .where(eq(rolePickers.guildId, interaction.guildId!));
            }
        }

        const channel = this.getChannel(interaction, 'channel', true)!;
        if (!channel.isSendable()) {
            return await interaction.editReply('Channel is not sendable.');
        }

        const embed = new EmbedBuilder()
            .setTitle('Role Picker')
            .setColor(Colors.Yellow)
            .setDescription(
                stripIndents`
                    ${bold('Seed')} - for seed notifier
                    ${bold('Gear')} - for gear notifier
                    ${bold('Egg')} - for egg notifier
                    ${bold('Weather')} - for weather notifier
                    ${bold('Extra')} - for cosmetic/event/notification/traveling merchant  notifier
                `,
            )
            .setFooter({
                text: 'Use the buttons below to manage your notifiers.',
            });

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            ...gagCategories.map((item) => this.createRolePickerButton(item)),
        );

        const message = await channel.send({
            embeds: [embed],
            components: [row],
        });

        await db.insert(rolePickers).values({
            guildId: interaction.guildId!,
            channelId: channel.id,
            messageId: message.id,
        });

        return await interaction.editReply('Role picker created.');
    }

    private createRolePickerButton(forCategory: string) {
        return new ButtonBuilder()
            .setCustomId(`role-picker_${forCategory.toLowerCase()}`)
            .setLabel(forCategory)
            .setStyle(ButtonStyle.Secondary);
    }
}
