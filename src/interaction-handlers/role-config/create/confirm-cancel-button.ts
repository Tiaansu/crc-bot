import { db } from '@/lib/db';
import { rolesConfig } from '@/lib/db/schema';
import { syncRolesForGuild } from '@/utils/sync-roles-for-guild';
import { ApplyOptions } from '@sapphire/decorators';
import {
    InteractionHandler,
    InteractionHandlerTypes,
} from '@sapphire/framework';
import type { ButtonInteraction } from 'discord.js';
import { DurationFormatter } from '@sapphire/time-utilities';

@ApplyOptions<InteractionHandler.Options>({
    interactionHandlerType: InteractionHandlerTypes.Button,
})
export class RoleConfigHandler extends InteractionHandler {
    public override parse(interaction: ButtonInteraction) {
        if (!this.isConfirmOrCancelButton(interaction)) return this.none();
        return this.some();
    }

    public override async run(interaction: ButtonInteraction) {
        const { container } = this;
        await interaction.deferUpdate();

        if (this.isCancelButton(interaction)) {
            container.pendingRoleCreation.delete(interaction.user.id);
            return await interaction.editReply({
                content: 'Cancelled.',
                components: [],
                embeds: [],
            });
        }

        const pending = container.pendingRoleCreation.get(interaction.user.id);
        if (
            !pending ||
            !pending.itemId ||
            !pending.itemName ||
            !pending.itemHexColor
        ) {
            container.pendingRoleCreation.delete(interaction.user.id);
            return await interaction.editReply({
                content: 'Cancelled.',
                components: [],
                embeds: [],
            });
        }

        await db.insert(rolesConfig).values({
            itemId: pending.itemId,
            name: pending.itemName,
            type: pending.itemType,
            color: parseInt(pending.itemHexColor.slice(1), 16),
        });

        await interaction.editReply({
            content: 'Role config created. Doing a global sync...',
            components: [],
            embeds: [],
        });

        const guilds = container.client.guilds.cache;
        const promise = [];

        for (const [, guild] of guilds) {
            promise.push(syncRolesForGuild(guild));
        }

        const now = Date.now();
        await Promise.all(promise);
        const end = Date.now();

        return await interaction.editReply({
            content: `Took ${new DurationFormatter().format(end - now)} to sync the roles of ${guilds.size} guilds.`,
            embeds: [],
            components: [],
        });
    }

    private isConfirmOrCancelButton(interaction: ButtonInteraction) {
        return (
            this.isConfirmButton(interaction) ||
            this.isCancelButton(interaction)
        );
    }

    private isConfirmButton(interaction: ButtonInteraction) {
        return interaction.customId === 'role-config-create-confirm';
    }

    private isCancelButton(interaction: ButtonInteraction) {
        return interaction.customId === 'role-config-create-cancel';
    }
}
