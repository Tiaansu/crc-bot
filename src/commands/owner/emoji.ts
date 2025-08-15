import { $fetch } from '@/lib/fetch';
import { infoSchemaArray } from '@/lib/schemas/info';
import { processInBatch } from '@/utils/process-in-batch';
import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, type Awaitable } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import type { z } from 'zod';

@ApplyOptions<Subcommand.Options>({
    name: 'emoji',
    description: 'A command to manage application emojis.',
    subcommands: [
        {
            name: 'create',
            chatInputRun: 'chatInputRunEmojiCreate',
            preconditions: ['BotOwnerOnly', 'EphemeralDefer'],
        },
        {
            name: 'delete',
            chatInputRun: 'chatInputRunEmojiDelete',
            preconditions: ['BotOwnerOnly', 'EphemeralDefer'],
        },
    ],
})
export class BotCommand extends Subcommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry): Awaitable<void> {
        registry.registerChatInputCommand(
            (builder) =>
                builder
                    .setName(this.name)
                    .setDescription(this.description)
                    .addSubcommand((command) => command.setName('create').setDescription('Create potential new emojis'))
                    .addSubcommand((command) => command.setName('delete').setDescription('Completely remove emojis')),
            {
                guildIds: ['1025336952381263882'],
            },
        );
    }

    public async chatInputRunEmojiCreate(interaction: Subcommand.ChatInputCommandInteraction) {
        const { client } = this.container;

        await interaction.editReply('Please wait as the emojis are being checked...');

        const emojis = await client.application?.emojis.fetch()!;
        const emojisList = new Set(emojis.map((emoji) => emoji.name!));

        const types = ['seed', 'gear', 'egg', 'cosmetic', 'event'];
        const infos = await Promise.all(
            types.map((type) =>
                $fetch(`/growagarden/info?type=${type}`, {
                    output: infoSchemaArray,
                }),
            ),
        );
        const allItems = infos.flat();

        const potentialNewItems = allItems
            .map((item) => ({
                ...item,
                item_id: item.item_id.replace("'", ''),
            }))
            .filter((item) => !emojisList.has(item.item_id));

        if (potentialNewItems.length < 1) {
            return await interaction.editReply('No new emojis found.');
        }

        await interaction.editReply(
            `Found ${potentialNewItems.length} potential new emojis. Checking image validity... (0 / ${potentialNewItems.length})`,
        );

        const checkValidity = async (item: z.infer<typeof infoSchemaArray>[0]) => {
            try {
                const response = await fetch(item.icon, {
                    method: 'HEAD',
                });
                return response.ok ? item : null;
            } catch {
                return null;
            }
        };

        const progressCallback = (processed: number, total: number) =>
            interaction.editReply(
                `Found ${potentialNewItems.length} potential new emojis. Checking image validity... (${processed} / ${total})`,
            );

        const BATCH_SIZE = 25;
        const checkedItems = await processInBatch(potentialNewItems, BATCH_SIZE, checkValidity, progressCallback);

        const validItemsToAdd = checkedItems.filter((item): item is NonNullable<typeof item> => item !== null);

        if (validItemsToAdd.length < 1) {
            return await interaction.editReply('No valid new emojis found.');
        }

        const skippedCount = potentialNewItems.length - validItemsToAdd.length;
        await interaction.editReply(
            `Found ${validItemsToAdd.length} valid emojis to create. ${skippedCount > 0 ? `(Skipping ${skippedCount} with unavailable images)` : ''} Creating them now...`,
        );

        const requests = validItemsToAdd.map((item) =>
            client.application?.emojis.create({
                name: item.item_id,
                attachment: item.icon,
            }),
        );

        const start = Date.now();
        const results = await Promise.allSettled(requests);
        const end = Date.now();

        const success = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.length - success;

        return interaction.editReply(
            `Successfully created ${success} emojis in ${end - start}ms.${failed > 0 ? `\nFailed to create ${failed} emojis.` : ''}`,
        );
    }

    public async chatInputRunEmojiDelete(interaction: Subcommand.ChatInputCommandInteraction) {
        const { client } = this.container;

        await interaction.editReply('Please wait as the emojis are being fetched...');

        const emojis = await client.application?.emojis.fetch()!;
        const emojiIds = emojis.filter((emoji) => emoji.name !== 'fallback').map((emoji) => emoji.id!);

        await interaction.editReply(`Deleting ${emojiIds.length} emojis... (0 / ${emojiIds.length})`);

        const deleteFn = async (emojiId: string) => {
            try {
                await client.application?.emojis.delete(emojiId);
                return true;
            } catch {
                return false;
            }
        };

        const progress = (processed: number, total: number) =>
            interaction.editReply(`Deleting ${emojiIds.length} emojis... (${processed} / ${total})`);

        const BATCH_SIZE = 25;
        const checkedItems = await processInBatch(emojiIds, BATCH_SIZE, deleteFn, progress);

        const success = checkedItems.filter((item) => item).length;
        const failed = emojiIds.length - success;

        return interaction.editReply(
            `Successfully deleted ${success} emojis.${failed > 0 ? `\nFailed to delete ${failed} emojis.` : ''}`,
        );
    }
}
