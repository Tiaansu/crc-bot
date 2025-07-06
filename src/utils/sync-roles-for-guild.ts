import { db } from '@/lib/db';
import { roles, rolesConfig } from '@/lib/db/schema';
import { container } from '@sapphire/pieces';
import { PermissionFlagsBits, type Guild } from 'discord.js';
import { and, eq } from 'drizzle-orm';

export async function syncRolesForGuild(guild: Guild) {
    container.logger.info(
        `Syncing roles for guild: ${guild.name} (${guild.id})`,
    );

    if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
        container.logger.warn(
            `Missing 'Manage Roles' permission in guild ${guild.name} (${guild.id})`,
        );
        return;
    }

    try {
        const [roleConfig, existingGuildRoles] = await Promise.all([
            db.select().from(rolesConfig),
            db.select().from(roles).where(eq(roles.guildId, guild.id)),
        ]);

        const roleConfigIds = roleConfig.map((item) => item.itemId);
        const existingGuildRolesMap = new Map(
            existingGuildRoles.map((r) => [r.forItem, r.roleId]),
        );

        const guildRoles = await guild.roles.fetch();

        const rolesToDelete = existingGuildRoles.filter(
            (r) => !roleConfigIds.includes(r.forItem),
        );

        const promise = [];

        for (const role of rolesToDelete) {
            const guildRole = guildRoles.get(role.roleId);

            if (guildRole) {
                promise.push(
                    guildRole.delete(
                        `Role no longer configured: ${role.forItem}`,
                    ),
                );
            }

            promise.push(
                db
                    .delete(roles)
                    .where(
                        and(
                            eq(roles.guildId, guild.id),
                            eq(roles.roleId, role.roleId),
                        ),
                    ),
            );
        }

        for (const role of roleConfig) {
            const existingRole = existingGuildRolesMap.get(role.itemId);
            const guildRole = existingRole
                ? guild.roles.cache.get(existingRole)
                : null;

            if (guildRole) {
                if (
                    guildRole.name !== role.name ||
                    guildRole.color !== role.color
                ) {
                    promise.push(
                        guildRole.edit({
                            name: role.name,
                            color: role.color,
                        }),
                    );
                }
            } else {
                const newRole = await guild.roles.create({
                    name: role.name,
                    color: role.color,
                    permissions: [],
                    reason: 'Automated role creation by bot.',
                });

                await db.insert(roles).values({
                    guildId: guild.id,
                    roleId: newRole.id,
                    forItem: role.itemId,
                    forType: role.type,
                });
            }
        }

        await Promise.all(promise);

        container.logger.info(
            `Finished sync for guild: ${guild.name} (${guild.id})`,
        );
    } catch (error) {
        container.logger.info(
            `Failed to sync roles for guild: ${guild.name} (${guild.id})`,
            error,
        );
    }
}
