import { db } from '@/lib/db';
import { channels, roles } from '@/lib/db/schema';
import { $fetch } from '@/lib/fetch';
import type {
    notificationSchema,
    stockSchema,
    travellingMerchantSchema,
    weatherSchema,
} from '@/lib/schemas/gag-ws';
import { container } from '@sapphire/pieces';
import { oneLineCommaListsAnd, stripIndents } from 'common-tags';
import {
    ApplicationEmoji,
    bold,
    Collection,
    EmbedBuilder,
    formatEmoji,
    roleMention,
    time,
    WebhookClient,
    type APIEmbedField,
    type APIMessage,
} from 'discord.js';
import { and, eq, inArray } from 'drizzle-orm';
import type { z } from 'zod';

export async function sendStockNotification(data: {
    seed_stock: z.infer<typeof stockSchema>;
    gear_stock: z.infer<typeof stockSchema>;
}) {
    container.logger.info('Sending stock update.');

    if (!data.seed_stock.length && !data.gear_stock.length) {
        container.logger.warn(
            'No stock data available. Cannot send notification.',
        );
        container.logger.info('Data received:', JSON.stringify(data, null, 4));
        return;
    }

    const { client } = container;
    const emojis = await client.application?.emojis.fetch()!;
    const channelsConfig = await getChannels('stock');

    const referenceData =
        data.seed_stock?.length > 0 ? data.seed_stock : data.gear_stock;
    if (!referenceData.length) {
        container.logger.error('No reference data available for timestamps');
        return;
    }

    const startUnix = referenceData[0].start_date_unix;
    const endUnix = referenceData[0].end_date_unix;
    const description = `Here's the stock as of ${time(startUnix)} (${time(startUnix, 'R')}). It will reset at ${time(endUnix)} (${time(endUnix, 'R')}).`;

    channelsConfig.forEach(async (g) => {
        const webhook = new WebhookClient({
            url: g.webhookUrl,
        });

        const itemIdsToFind = [
            ...(data.seed_stock || []),
            ...(data.gear_stock || []),
        ].map((item) => item.item_id.replace("'", ''));

        const rolesConfig = await db
            .select()
            .from(roles)
            .where(
                and(
                    eq(roles.guildId, g.guildId),
                    inArray(roles.forItem, itemIdsToFind),
                ),
            );

        const embed = createEmbed('Stock', description);

        if (data.seed_stock.length > 0) {
            const text = createStockText('Seed', data.seed_stock, emojis);
            embed.addFields(text);
        }
        if (data.gear_stock.length > 0) {
            const text = createStockText('Gear', data.gear_stock, emojis);
            embed.addFields(text);
        }

        const roleIds = rolesConfig.map((r) => r.roleId);
        sendWebhook(webhook, embed, roleIds);
    });
}

export async function sendEggStockNotification(
    data: z.infer<typeof stockSchema>,
) {
    container.logger.info('Sending egg stock update.');
    if (data === undefined || data.length === 0) {
        container.logger.warn(
            'Egg stock data is undefined or empty. Cannot send notification.',
        );
        return;
    }

    const { client } = container;
    const emojis = await client.application?.emojis.fetch()!;

    const channelsConfig = await getChannels('egg');

    const startUnix = data[0].start_date_unix;
    const endUnix = data[0].end_date_unix;
    const description = `Here's the egg stock as of ${time(startUnix)} (${time(startUnix, 'R')}). It will reset at ${time(endUnix)} (${time(endUnix, 'R')}).`;

    channelsConfig.forEach(async (g) => {
        const webhook = new WebhookClient({
            url: g.webhookUrl,
        });

        const itemIdsToFind = data.map((item) => item.item_id.replace("'", ''));

        const rolesConfig = await db
            .select()
            .from(roles)
            .where(
                and(
                    eq(roles.guildId, g.guildId),
                    inArray(roles.forItem, itemIdsToFind),
                ),
            );

        const embed = createEmbed('Egg', description);

        if (data.length > 0) {
            const text = createStockText('Egg', data, emojis);
            embed.addFields(text);
        }

        const roleIds = rolesConfig.map((r) => r.roleId);
        sendWebhook(webhook, embed, roleIds);
    });
}

export async function sendCosmeticStockNotification(
    data: z.infer<typeof stockSchema>,
) {
    container.logger.info('Sending cosmetic stock update.');
    if (data === undefined || data.length === 0) {
        container.logger.warn(
            'Cosmetic stock data is undefined or empty. Cannot send notification.',
        );
        return;
    }

    const { client } = container;
    const emojis = await client.application?.emojis.fetch()!;

    const channelsConfig = await getChannels('cosmetic');

    const startUnix = data[0].start_date_unix;
    const endUnix = data[0].end_date_unix;
    const description = `Here's the cosmetic stock as of ${time(startUnix)} (${time(startUnix, 'R')}). It will reset at ${time(endUnix)} (${time(endUnix, 'R')}).`;

    channelsConfig.forEach(async (g) => {
        const webhook = new WebhookClient({
            url: g.webhookUrl,
        });

        const rolesConfig = await db
            .select()
            .from(roles)
            .where(
                and(
                    eq(roles.guildId, g.guildId),
                    eq(roles.forType, 'cosmetic'),
                ),
            );

        const embed = createEmbed('Cosmetic', description);

        if (data.length > 0) {
            const text = createStockText('Cosmetic', data, emojis);
            embed.addFields(text);
        }

        const roleIds = rolesConfig.map((r) => r.roleId);
        sendWebhook(webhook, embed, roleIds);
    });
}

export async function sendEventStockNotification(
    data: z.infer<typeof stockSchema>,
) {
    container.logger.info('Sending event shop stock update.');
    if (data === undefined || data.length === 0) {
        container.logger.warn(
            'Even shop stock data is undefined or empty. Cannot send notification.',
        );
        return;
    }

    const { client } = container;
    const emojis = await client.application?.emojis.fetch()!;

    const channelsConfig = await getChannels('event');

    const startUnix = data[0].start_date_unix;
    const endUnix = data[0].end_date_unix;
    const description = `Here's the event stock as of ${time(startUnix)} (${time(startUnix, 'R')}). It will reset at ${time(endUnix)} (${time(endUnix, 'R')}).`;

    channelsConfig.forEach(async (g) => {
        const webhook = new WebhookClient({
            url: g.webhookUrl,
        });

        const rolesConfig = await db
            .select()
            .from(roles)
            .where(
                and(eq(roles.guildId, g.guildId), eq(roles.forType, 'event')),
            );

        const embed = createEmbed('Event', description);

        if (data.length > 0) {
            const text = createStockText('Event', data, emojis);
            embed.addFields(text);
        }

        const roleIds = rolesConfig.map((r) => r.roleId);
        sendWebhook(webhook, embed, roleIds);
    });
}

export async function sendTravellingMerchantStockNotification(
    data: z.infer<typeof travellingMerchantSchema>,
) {
    container.logger.info('Sending traveling merchant stock update.');
    if (data === undefined) {
        container.logger.warn(
            'Traveling merchant stock data is undefined or empty. Cannot send notification.',
        );
        return;
    }

    const { client } = container;
    const emojis = await client.application?.emojis.fetch()!;

    const channelsConfig = await getChannels('travelingmerchant');

    const startUnix = data.stocks[0].start_date_unix;
    const endUnix = data.stocks[0].end_date_unix;
    const description = `Here's the traveling merchant stock as of ${time(startUnix)} (${time(startUnix, 'R')}). It will reset at ${time(endUnix)} (${time(endUnix, 'R')}).`;

    channelsConfig.forEach(async (g) => {
        const webhook = new WebhookClient({
            url: g.webhookUrl,
        });

        const rolesConfig = await db
            .select()
            .from(roles)
            .where(
                and(
                    eq(roles.guildId, g.guildId),
                    eq(roles.forType, 'travelingmerchant'),
                ),
            );

        const embed = createEmbed(
            `Traveling Merchant - ${data.merchantName}`,
            description,
        );

        if (data.stocks.length > 0) {
            const text = createStockText(
                data.merchantName,
                data.stocks,
                emojis,
            );
            embed.addFields(text);
        }

        const roleIds = rolesConfig.map((r) => r.roleId);
        sendWebhook(webhook, embed, roleIds);
    });
}

export async function sendNotification(
    data: z.infer<typeof notificationSchema>,
) {
    container.logger.info('Sending notification.');
    if (data === undefined || data.length === 0) {
        container.logger.warn(
            'Notification data is undefined or empty. Cannot send notification.',
        );
        return;
    }

    const now = Math.floor(Date.now() / 1000);
    const filtered = data.filter((item) => {
        const hash = getNotificationHash(item);
        const existing = container.lastNotificationHash === hash;
        container.lastNotificationHash = hash;

        // We're going to ignore notifications that are older than 1 second
        const isOld = now - item.timestamp > 1000;

        return !isOld && !existing;
    });

    const channelsConfig = await getChannels('notification');
    channelsConfig.forEach(async (g) => {
        const webhook = new WebhookClient({
            url: g.webhookUrl,
        });

        const rolesConfig = await db
            .select()
            .from(roles)
            .where(
                and(
                    eq(roles.guildId, g.guildId),
                    eq(roles.forType, 'notification'),
                ),
            );

        const roleIds = rolesConfig.map((r) => r.roleId);
        const promise: Promise<APIMessage>[] = [];

        filtered.forEach((item) => {
            const startTimestamp = item.timestamp;
            const endTimestamp = item.end_timestamp;
            const description = stripIndents`
                ${startTimestamp ? `${time(startTimestamp)} (${time(startTimestamp, 'R')})` : ''}
                ${endTimestamp ? `${time(endTimestamp)} (${time(endTimestamp, 'R')})` : ''}
            `;

            container.lastNotificationHash = getNotificationHash(item);
            const embed = createEmbed(item.message, description);
            promise.push(sendWebhook(webhook, embed, roleIds));
        });

        await Promise.all(promise);
    });
}

export async function sendWeatherNotification(
    data: z.infer<typeof weatherSchema>,
) {
    container.logger.info('Sending weather update.');
    if (data === undefined || data.length === 0) {
        container.logger.warn(
            'Weather data is undefined or empty. Cannot send notification.',
        );
        return;
    }

    const weatherInfos = await $fetch('/growagarden/info?type=weather', {
        headers: {
            'Jstudio-key': 'jstudio',
        },
    });
    const activeWeathers = data.filter((item) => {
        const startUnix = container.weatherStartUnix.get(item.weather_id);
        const isItemActive = item.active;
        container.weatherStartUnix.set(
            item.weather_id,
            item.start_duration_unix,
        );

        if (!startUnix) return isItemActive;
        return startUnix !== item.start_duration_unix && isItemActive;
    });

    const channelsConfig = await getChannels('weather');
    channelsConfig.forEach(async (g) => {
        const webhook = new WebhookClient({
            url: g.webhookUrl,
        });

        const rolesConfig = await db
            .select()
            .from(roles)
            .where(
                and(eq(roles.guildId, g.guildId), eq(roles.forType, 'weather')),
            );

        const promise: Promise<APIMessage>[] = [];

        activeWeathers.forEach((weather) => {
            const weatherInfo = weatherInfos.find(
                (info) => info.item_id === weather.weather_id,
            );
            if (!weatherInfo) return;

            const description = stripIndents`
                Starts at ${time(weather.start_duration_unix)} (${time(weather.start_duration_unix, 'R')}) until ${time(weather.end_duration_unix)} (${time(weather.end_duration_unix, 'R')}).

                ${weatherInfo.description}
            `;

            const embed = createEmbed(
                weatherInfo.display_name,
                description,
            ).setThumbnail(weatherInfo.icon);

            const roleConfig = rolesConfig.find(
                (role) => role.forItem === weather.weather_id,
            );
            if (roleConfig) {
            }

            promise.push(
                sendWebhook(
                    webhook,
                    embed,
                    roleConfig ? [roleConfig.roleId] : [],
                ),
            );
        });

        await Promise.all(promise);
    });
}

// helpers

function getNotificationHash(data: z.infer<typeof notificationSchema>[0]) {
    return new Bun.MD5().update(String(data)).digest('hex');
}

function createEmbed(title: string, description: string) {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setFooter({
            text: 'Powered by JStudio | Made with ❤️ by Tiaansu',
        })
        .setColor('Yellow');
}

function createStockText(
    label: string,
    data: z.infer<typeof stockSchema>,
    emojis: Collection<string, ApplicationEmoji>,
): APIEmbedField {
    const arr = data.map((item) => {
        const emoji = getEmoji(emojis, item.item_id.replace("'", ''));
        return `${formatEmoji(emoji.id)} ${item.display_name} ${bold(`x${item.quantity}`)}`;
    });

    return {
        name: label,
        value: arr.join('\n'),
        inline: true,
    };
}

function getEmoji(emojis: Collection<string, ApplicationEmoji>, name: string) {
    const fallback = emojis.find((emoji) => emoji.name === 'fallback')!;
    return emojis.find((emoji) => emoji.name === name) || fallback;
}

async function sendWebhook(
    webhook: WebhookClient,
    embed: EmbedBuilder,
    roleIds: string[],
) {
    return await webhook.send({
        content: oneLineCommaListsAnd`${roleIds.map((id) => roleMention(id))}`,
        embeds: [embed],
    });
}

async function getChannels(type: string) {
    return await db.query.channels.findMany({
        where: eq(channels.forType, type),
    });
}
