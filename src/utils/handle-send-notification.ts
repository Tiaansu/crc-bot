import { db } from '@/lib/db';
import { channels, roles } from '@/lib/db/schema';
import { $fetch } from '@/lib/fetch';
import type {
    notificationSchema,
    stockSchema,
    weatherSchema,
} from '@/lib/schemas/gag-ws';
import { container } from '@sapphire/pieces';
import { oneLineCommaListsAnd, stripIndents } from 'common-tags';
import {
    ApplicationEmoji,
    bold,
    Collection,
    ContainerBuilder,
    formatEmoji,
    heading,
    HeadingLevel,
    MessageFlags,
    roleMention,
    SectionBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
    ThumbnailBuilder,
    time,
    WebhookClient,
    type APIMessage,
} from 'discord.js';
import { and, eq, inArray } from 'drizzle-orm';
import type { z } from 'zod';

export async function sendStockNotification(data: {
    seed_stock: z.infer<typeof stockSchema>;
    gear_stock: z.infer<typeof stockSchema>;
}) {
    container.logger.info('Sending stock update.');

    const { client } = container;
    const emojis = await client.application?.emojis.fetch()!;

    const channelsConfig = await getChannels('stock');

    channelsConfig.forEach(async (g) => {
        const webhook = new WebhookClient({
            url: g.webhookUrl,
        });

        const itemIdsToFind = [...data.seed_stock, ...data.gear_stock].map(
            (item) => item.item_id.replace("'", ''),
        );

        const rolesConfig = await db
            .select()
            .from(roles)
            .where(
                and(
                    eq(roles.guildId, g.guildId),
                    inArray(roles.forItem, itemIdsToFind),
                ),
            );

        const _data = data.seed_stock ?? data.gear_stock;
        if (_data === undefined) return; // idk

        const start_unix = _data[0].start_date_unix;
        const end_unix = _data[0].end_date_unix;
        const description = new TextDisplayBuilder().setContent(
            `Here's the stock as of ${time(start_unix)} (${time(start_unix, 'R')}). It will reset at ${time(end_unix)} (${time(end_unix, 'R')}).`,
        );

        const { container, separator } = createContainerAndSeparator();

        container
            .addTextDisplayComponents(description)
            .addSeparatorComponents(separator);

        if (data.seed_stock.length > 0) {
            const text = createStockText('Seed', data.seed_stock, emojis);
            container
                .addTextDisplayComponents(text)
                .addSeparatorComponents(separator);
        }

        if (data.gear_stock.length > 0) {
            const text = createStockText('Gear', data.gear_stock, emojis);
            container
                .addTextDisplayComponents(text)
                .addSeparatorComponents(separator);
        }

        container.addTextDisplayComponents(
            createFooter(rolesConfig.map((role) => role.roleId)),
        );

        sendWebhook(webhook, container);
    });
}

export async function sendEggStockNotification(
    data: z.infer<typeof stockSchema>,
) {
    container.logger.info('Sending egg stock update.');
    if (data === undefined) {
        container.logger.warn(
            'Egg stock data is undefined. Cannot send notification.',
        );
        return;
    }

    const { client } = container;
    const emojis = await client.application?.emojis.fetch()!;

    const channelsConfig = await getChannels('egg');

    const start_unix = data[0].start_date_unix;
    const end_unix = data[0].end_date_unix;
    const description = new TextDisplayBuilder().setContent(
        `Here's the egg stock as of ${time(start_unix)} (${time(start_unix, 'R')}). It will reset at ${time(end_unix)} (${time(end_unix, 'R')}).`,
    );

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

        const { container, separator } = createContainerAndSeparator();

        container
            .addTextDisplayComponents(description)
            .addSeparatorComponents(separator);

        if (data.length > 0) {
            const text = createStockText('Egg', data, emojis);
            container
                .addTextDisplayComponents(text)
                .addSeparatorComponents(separator);
        }

        container.addTextDisplayComponents(
            createFooter(rolesConfig.map((role) => role.roleId)),
        );

        sendWebhook(webhook, container);
    });
}

export async function sendCosmeticStockNotification(
    data: z.infer<typeof stockSchema>,
) {
    container.logger.info('Sending cosmetic stock update.');
    if (data === undefined) {
        container.logger.warn(
            'Cosmetic stock data is undefined. Cannot send notification.',
        );
        return;
    }

    const { client } = container;
    const emojis = await client.application?.emojis.fetch()!;

    const channelsConfig = await getChannels('cosmetic');

    const start_unix = data[0].start_date_unix;
    const end_unix = data[0].end_date_unix;
    const description = new TextDisplayBuilder().setContent(
        `Here's the cosmetic stock as of ${time(start_unix)} (${time(start_unix, 'R')}). It will reset at ${time(end_unix)} (${time(end_unix, 'R')}).`,
    );

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

        const { container, separator } = createContainerAndSeparator();

        container
            .addTextDisplayComponents(description)
            .addSeparatorComponents(separator);

        if (data.length > 0) {
            const text = createStockText('Cosmetic', data, emojis);
            container
                .addTextDisplayComponents(text)
                .addSeparatorComponents(separator);
        }

        container.addTextDisplayComponents(
            createFooter(rolesConfig.map((role) => role.roleId)),
        );

        sendWebhook(webhook, container);
    });
}

export async function sendEventStockNotification(
    data: z.infer<typeof stockSchema>,
) {
    container.logger.info('Sending event shop stock update.');
    if (data === undefined) {
        container.logger.warn(
            'Even shop stock data is undefined. Cannot send notification.',
        );
        return;
    }

    const { client } = container;
    const emojis = await client.application?.emojis.fetch()!;

    const channelsConfig = await getChannels('event');

    const start_unix = data[0].start_date_unix;
    const end_unix = data[0].end_date_unix;
    const description = new TextDisplayBuilder().setContent(
        `Here's the event stock as of ${time(start_unix)} (${time(start_unix, 'R')}). It will reset at ${time(end_unix)} (${time(end_unix, 'R')}).`,
    );

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

        const { container, separator } = createContainerAndSeparator();

        container
            .addTextDisplayComponents(description)
            .addSeparatorComponents(separator);

        if (data.length > 0) {
            const text = createStockText('Event', data, emojis);
            container
                .addTextDisplayComponents(text)
                .addSeparatorComponents(separator);
        }

        container.addTextDisplayComponents(
            createFooter(rolesConfig.map((role) => role.roleId)),
        );

        sendWebhook(webhook, container);
    });
}

export async function sendTravelingMerchantStockNotification(
    data: z.infer<typeof stockSchema>,
) {
    container.logger.info('Sending traveling merchant stock update.');
    if (data === undefined) {
        container.logger.warn(
            'Traveling Merchant stock data is undefined. Cannot send notification.',
        );
        return;
    }

    const { client } = container;
    const emojis = await client.application?.emojis.fetch()!;

    const channelsConfig = await getChannels('travelingmerchant');

    const start_unix = data[0].start_date_unix;
    const end_unix = data[0].end_date_unix;
    const description = new TextDisplayBuilder().setContent(
        `Here's the traveling merchant stock as of ${time(start_unix)} (${time(start_unix, 'R')}). It will reset at ${time(end_unix)} (${time(end_unix, 'R')}).`,
    );

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

        const { container, separator } = createContainerAndSeparator();

        container
            .addTextDisplayComponents(description)
            .addSeparatorComponents(separator);

        if (data.length > 0) {
            const text = createStockText('Traveling Merchant', data, emojis);
            container
                .addTextDisplayComponents(text)
                .addSeparatorComponents(separator);
        }

        container.addTextDisplayComponents(
            createFooter(rolesConfig.map((role) => role.roleId)),
        );

        sendWebhook(webhook, container);
    });
}

export async function sendNotification(
    data: z.infer<typeof notificationSchema>,
) {
    container.logger.info('Sending notification.');
    if (data === undefined) {
        container.logger.warn(
            'Notification data is undefined. Cannot send notification.',
        );
        return;
    }

    const startTimestamp = data[0].timestamp;
    const endTimestamp = data[0].end_timestamp;
    const description = new TextDisplayBuilder().setContent(
        stripIndents`
            ${heading(data[0].message, HeadingLevel.Two)}

            ${startTimestamp ? `${time(startTimestamp)} (${time(startTimestamp, 'R')})` : ''}
            ${endTimestamp ? `${time(endTimestamp)} (${time(endTimestamp, 'R')})` : ''}
        `,
    );

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

        const { container, separator } = createContainerAndSeparator();

        container
            .addTextDisplayComponents(description)
            .addSeparatorComponents(separator)
            .addTextDisplayComponents(
                createFooter(rolesConfig.map((role) => role.roleId)),
            );

        sendWebhook(webhook, container);
    });
}

export async function sendWeatherNotification(
    data: z.infer<typeof weatherSchema>,
) {
    container.logger.info('Sending weather update.');
    if (data === undefined) {
        container.logger.warn(
            'Weather data is undefined. Cannot send notification.',
        );
        return;
    }

    const { client } = container;
    const emojis = await client.application?.emojis.fetch()!;

    const weatherInfos = await $fetch('/growagarden/info?type=weather', {
        headers: {
            'Jstudio-key': 'jstudio',
        },
    });
    const activeWeathers = data.filter((item) => item.active);

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

            const { container, separator } = createContainerAndSeparator();
            const emoji = getEmoji(emojis, weather.weather_id);

            const text = new TextDisplayBuilder().setContent(stripIndents`
                ${heading(`${emoji} ${weatherInfo.display_name}`, HeadingLevel.Two)}

                Starts at ${time(weather.start_duration_unix)} (${time(weather.start_duration_unix, 'R')}) until ${time(weather.end_duration_unix)} (${time(weather.end_duration_unix, 'R')}).

                ${weatherInfo.description}
            `);
            const image = new ThumbnailBuilder()
                .setURL(weatherInfo.icon)
                .setDescription(weatherInfo.display_name);
            const section = new SectionBuilder()
                .addTextDisplayComponents(text)
                .setThumbnailAccessory(image);

            container
                .addSectionComponents(section)
                .addSeparatorComponents(separator);

            const roleConfig = rolesConfig.find(
                (role) => role.forItem === weather.weather_id,
            );
            if (roleConfig) {
                container.addTextDisplayComponents(
                    createFooter([roleConfig.roleId]),
                );
            }

            promise.push(sendWebhook(webhook, container));
        });

        await Promise.all(promise);
    });
}

// helpers

function createContainerAndSeparator() {
    const container = new ContainerBuilder();
    const separator = new SeparatorBuilder().setSpacing(
        SeparatorSpacingSize.Large,
    );

    return { container, separator };
}

function createFooter(roleIds: string[]) {
    const roleMentions = oneLineCommaListsAnd`${roleIds.map((id) => roleMention(id))}`;
    const footer = new TextDisplayBuilder().setContent(stripIndents`
            ${roleMentions}

            -# Powered by JStudio | Made with ❤️ by Tiaansu
        `);
    return footer;
}

function createStockText(
    label: string,
    data: z.infer<typeof stockSchema>,
    emojis: Collection<string, ApplicationEmoji>,
) {
    const arr = data.map((item) => {
        const emoji = getEmoji(emojis, item.item_id.replace("'", ''));
        return `${formatEmoji(emoji.id)} ${item.display_name} ${bold(`x${item.quantity}`)}`;
    });

    const text = new TextDisplayBuilder().setContent(stripIndents`
        # ${label}

        ${arr.join('\n')}
    `);
    return text;
}

function getEmoji(emojis: Collection<string, ApplicationEmoji>, name: string) {
    const fallback = emojis.find((emoji) => emoji.name === 'fallback')!;
    return emojis.find((emoji) => emoji.name === name) || fallback;
}

async function sendWebhook(
    webhook: WebhookClient,
    container: ContainerBuilder,
) {
    return await webhook.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
    });
}

async function getChannels(type: string) {
    return await db.query.channels.findMany({
        where: eq(channels.forType, type),
    });
}
