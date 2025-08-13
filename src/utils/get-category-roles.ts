import { db } from '@/lib/db';
import { roles, rolesConfig } from '@/lib/db/schema';
import { and, eq, inArray } from 'drizzle-orm';

const extraCategoryItems = ['cosmetic', 'event', 'notification', 'travelingmerchant'];

export async function getCategoryRoles(guildId: string, category: string) {
    const isExtra = category === 'extra';

    return db
        .select({
            roleId: roles.roleId,
        })
        .from(roles)
        .where(
            and(
                eq(roles.guildId, guildId),
                isExtra ? inArray(roles.forType, extraCategoryItems) : eq(roles.forType, category),
            ),
        );
}

export async function getCategoryRolesConfig(category: string) {
    const isExtra = category === 'extra';

    return db
        .select()
        .from(rolesConfig)
        .where(isExtra ? inArray(rolesConfig.type, extraCategoryItems) : eq(rolesConfig.type, category));
}
