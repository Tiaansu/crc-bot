import { db } from '@/lib/db';
import { roles, rolesConfig } from '@/lib/db/schema';
import { ApplyOptions } from '@sapphire/decorators';
import {
    InteractionHandler,
    InteractionHandlerTypes,
} from '@sapphire/framework';
import type { ButtonInteraction } from 'discord.js';
import { and, eq } from 'drizzle-orm';

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

        const editingItemId = this.container.currentEditingItemId.get(
            interaction.user.id,
        );
        if (!editingItemId) {
            container.pendingRoleCreation.delete(interaction.user.id);
            container.currentEditingItemId.delete(interaction.user.id);
            return await interaction.editReply({
                content: 'You are not editing a role config.',
                components: [],
                embeds: [],
            });
        }

        if (this.isCancelButton(interaction)) {
            container.pendingRoleCreation.delete(interaction.user.id);
            container.currentEditingItemId.delete(interaction.user.id);
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
            container.currentEditingItemId.delete(interaction.user.id);
            return await interaction.editReply({
                content: 'Cancelled.',
                components: [],
                embeds: [],
            });
        }

        const guilds = container.client.guilds.cache;
        const { itemId, itemName, itemType, itemHexColor } = pending;

        const promise: Promise<any>[] = [
            db
                .update(rolesConfig)
                .set({
                    itemId,
                    name: itemName,
                    type: itemType,
                    color: parseInt(itemHexColor.slice(1), 16),
                })
                .where(eq(rolesConfig.itemId, editingItemId)),
            db
                .update(roles)
                .set({
                    forItem: itemId,
                    forType: itemType,
                })
                .where(eq(roles.forItem, editingItemId)),
        ];

        for (const guild of guilds.values()) {
            const dbRoles = await db.query.roles.findFirst({
                where: and(
                    eq(roles.guildId, guild.id),
                    eq(roles.forItem, editingItemId),
                ),
            });
            if (!dbRoles) continue;

            const guildRole = guild.roles.cache.get(dbRoles.roleId);
            if (guildRole) {
                promise.push(
                    guildRole.edit({
                        name: itemName,
                        color: parseInt(itemHexColor.slice(1), 16),
                    }),
                );
            }
        }

        await Promise.all(promise);
        container.pendingRoleCreation.delete(interaction.user.id);
        container.currentEditingItemId.delete(interaction.user.id);
        return await interaction.editReply({
            content: 'Updated role config.',
            components: [],
            embeds: [],
        });
    }

    private isConfirmOrCancelButton(interaction: ButtonInteraction) {
        return (
            this.isConfirmButton(interaction) ||
            this.isCancelButton(interaction)
        );
    }

    private isConfirmButton(interaction: ButtonInteraction) {
        return interaction.customId === 'role-config-edit-confirm';
    }

    private isCancelButton(interaction: ButtonInteraction) {
        return interaction.customId === 'role-config-edit-cancel';
    }
}
