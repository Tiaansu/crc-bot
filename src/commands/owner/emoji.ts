import { $fetch } from '@/lib/fetch';
import { infoSchemaArray } from '@/lib/schemas/info';
import { ApplyOptions } from '@sapphire/decorators';
import {
    ApplicationCommandRegistry,
    Command,
    type Awaitable,
} from '@sapphire/framework';

@ApplyOptions<Command.Options>({
    name: 'emoji',
    description: 'A command to manage application emojis.',
    preconditions: ['BotOwnerOnly', 'EphemeralDefer'],
})
export class BotCommand extends Command {
    public override registerApplicationCommands(
        registry: ApplicationCommandRegistry,
    ): Awaitable<void> {
        registry.registerChatInputCommand(
            (builder) =>
                builder.setName(this.name).setDescription(this.description),
            {
                guildIds: ['1025336952381263882'],
            },
        );
    }

    public override async chatInputRun(
        interaction: Command.ChatInputCommandInteraction,
    ) {
        const { client } = this.container;
        const emojis = await client.application?.emojis.fetch()!;

        await interaction.editReply({
            content: 'Please wait as the emojis are being checked...',
        });

        const emojisList = new Set(
            emojis ? emojis.map((emoji) => emoji.name) : [],
        );

        const types = ['seed', 'gear', 'egg', 'weather', 'cosmetic', 'event'];
        const [seed, gear, egg, weather, cosmetic, event] = await Promise.all(
            types.map((type) =>
                $fetch(`/growagarden/info?type=${type}`, {
                    output: infoSchemaArray,
                }),
            ),
        );

        const notFoundItems = [
            ...seed
                .map((item) => ({
                    ...item,
                    item_id: item.item_id.replace("'", ''),
                }))
                .filter((item) => !emojisList.has(item.item_id)),
            ...gear
                .map((item) => ({
                    ...item,
                    item_id: item.item_id.replace("'", ''),
                }))
                .filter((item) => !emojisList.has(item.item_id)),
            ...egg
                .map((item) => ({
                    ...item,
                    item_id: item.item_id.replace("'", ''),
                }))
                .filter((item) => !emojisList.has(item.item_id)),
            ...weather
                .map((item) => ({
                    ...item,
                    item_id: item.item_id.replace("'", ''),
                }))
                .filter((item) => !emojisList.has(item.item_id)),
            ...cosmetic
                .map((item) => ({
                    ...item,
                    item_id: item.item_id.replace("'", ''),
                }))
                .filter((item) => !emojisList.has(item.item_id)),
            ...event
                .map((item) => ({
                    ...item,
                    item_id: item.item_id.replace("'", ''),
                }))
                .filter((item) => !emojisList.has(item.item_id)),
        ];

        if (notFoundItems.length < 1) {
            return interaction.editReply({
                content: 'All emojis are already in the application.',
            });
        }

        await interaction.editReply({
            content: `Found ${notFoundItems.length} emojis that are not in the application. Creating them now...`,
        });

        const request = notFoundItems.map((item) =>
            client.application?.emojis.create({
                name: item.item_id,
                attachment: item.icon,
            }),
        );

        const start = Date.now();
        await Promise.all(request);
        const end = Date.now();

        return interaction.editReply({
            content: `Successfully created ${notFoundItems.length} emojis in the application in ${end - start}ms.`,
        });
    }
}
