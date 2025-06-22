import type { ClientConfig } from '@/types/config';
import { rootFolder } from '@/utils/constants';
import { container } from '@sapphire/pieces';
import {
    envParseArray,
    envParseNumber,
    envParseString,
    setup,
} from '@skyra/env-utilities';
import { GatewayIntentBits, Partials, type ClientOptions } from 'discord.js';
import { join } from 'node:path';
import { BotLogger } from './lib/structures/bot-logger';
import { LogLevel } from '@sapphire/framework';

setup(join(rootFolder, '.env'));

export function loadConfig(): void {
    process.env.NODE_ENV ??= 'development';

    const env = envParseString('NODE_ENV');
    const isDev = env !== 'production';

    const clientConfig: ClientConfig = {
        isDev,
        ownerIds: envParseArray('BOT_OWNER_IDS'),
        serverAdminIds: envParseArray('SERVER_ADMIN_IDS'),
        tradingChannelId: envParseString('TRADING_CHANNEL_ID'),
        webhook: {
            id: envParseString('DISCORD_WEBHOOK').split('/').at(-2)!,
            token: envParseString('DISCORD_WEBHOOK').split('/').at(-1)!,
        },
    };

    container.config = clientConfig;
}

export const CLIENT_OPTIONS: ClientOptions = {
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [
        Partials.User,
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message,
        Partials.Reaction,
    ],
    logger: {
        instance: new BotLogger({
            level:
                envParseString('NODE_ENV') === 'production'
                    ? LogLevel.Info
                    : LogLevel.Debug,
            join: '\n',
        }),
    },
    api: {
        origin: '*',
        listenOptions: {
            port: envParseNumber('PORT'),
        },
    },
};
