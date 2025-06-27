import type { ArrayString, NumberString } from '@skyra/env-utilities';
import type { ClientConfig } from './config';
import type WebhookErrorBuilder from '@/lib/structures/webhook-error-builder';
import type { Guild } from 'discord.js';

declare module 'discord.js' {
    interface Client {
        readonly webhook: WebhookClient | null;
    }
}

declare module '@sapphire/pieces' {
    interface Container {
        config: ClientConfig;
        guild: Guild;
    }
}

declare module '@sapphire/framework' {
    interface ILogger {
        webhookError(
            builder: (builder: WebhookErrorBuilder) => WebhookErrorBuilder,
        ): Promise<void>;
    }

    interface Preconditions {
        BotOwnerOnly: never;
        Defer: never;
        EphemeralDefer: never;
    }
}

declare module '@skyra/env-utilities' {
    export interface Env {
        BOT_OWNER_IDS: ArrayString;
        SERVER_ADMIN_IDS: ArrayString;

        TRADING_CHANNEL_ID: string;
        DELETION_CHANNEL_ID: string;

        DISCORD_TOKEN: string;
        DISCORD_WEBHOOK: string;

        DATABASE_URL: string;

        PORT: NumberString;
        HEARTBEAT_URL: string;
    }
}
