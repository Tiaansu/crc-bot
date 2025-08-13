import { db } from '@/lib/db';
import { rolePickers } from '@/lib/db/schema';
import { gagCategories } from '@/utils/constants';
import { isFlaggedForShutdown } from '@/utils/flag-for-shutdown';
import { prepareAndReply } from '@/utils/prepare-and-reply-role-picker';
import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { inlineCode, MessageFlags, type ButtonInteraction } from 'discord.js';
import { and, eq } from 'drizzle-orm';

@ApplyOptions<InteractionHandler.Options>({
    interactionHandlerType: InteractionHandlerTypes.Button,
    name: 'role-picker-buttons',
})
export class RolePickerHandler extends InteractionHandler {
    public override parse(interaction: ButtonInteraction) {
        if (isFlaggedForShutdown()) return this.none();

        const [prefix, category] = interaction.customId.split('_');
        if (prefix !== 'role-picker' && !this.isRolePickerCategory(category)) return this.none();
        return this.some({ category });
    }

    public override async run(interaction: ButtonInteraction, { category }: { category: string }) {
        await interaction.deferReply({
            flags: MessageFlags.Ephemeral,
        });

        const rolePicker = await db.query.rolePickers.findFirst({
            where: and(
                eq(rolePickers.guildId, interaction.guildId!),
                eq(rolePickers.channelId, interaction.channelId!),
                eq(rolePickers.messageId, interaction.message.id),
            ),
            columns: {
                id: true,
            },
        });
        if (!rolePicker) {
            await interaction.editReply(
                `Role picker is not configured on this server but somehow you were able to use it. Please contact the server admin to run ${inlineCode('/setup role-picker create')}.`,
            );
            return;
        }

        await prepareAndReply(interaction, category, 0, interaction.user.id);
    }

    private isRolePickerCategory(category: string) {
        return gagCategories.map((item) => item.toLowerCase()).includes(category);
    }
}
