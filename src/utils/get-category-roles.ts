import { db } from '@/lib/db';
import { roles } from '@/lib/db/schema';
import { and, eq, inArray } from 'drizzle-orm';

export async function getCategoryRoles(guildId: string, category: string) {
    const extraCategoryItems = [
        'cosmetic',
        'event',
        'notification',
        'travelingmerchant',
    ];
    const isExtra = category === 'extra';

    return db
        .select({
            roleId: roles.roleId,
        })
        .from(roles)
        .where(
            and(
                eq(roles.guildId, guildId),
                isExtra
                    ? inArray(roles.forType, extraCategoryItems)
                    : eq(roles.forType, category),
            ),
        );
}
