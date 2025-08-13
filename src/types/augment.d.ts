import type { StockDebounceManager } from '@/lib/structures/stock-debounce-manager';
import type WebhookErrorBuilder from '@/lib/structures/webhook-error-builder';
import type { WebSocketMessageStore } from '@/lib/structures/ws-message-store';
import type { ArrayString } from '@skyra/env-utilities';
import type { Collection, Guild } from 'discord.js';
import type PusherServer from 'pusher';
import type PusherClient from 'pusher-js';
import type { Channel as PusherClientChannel } from 'pusher-js';
import type WebSocket from 'ws';
import type { ClientConfig } from './config';

declare module 'discord.js' {
    interface Client {
        readonly webhook: WebhookClient | null;
    }
}

declare module '@sapphire/pieces' {
    interface Container {
        config: ClientConfig;
        guild: Guild;
        isFlaggedForShutdown: boolean;
        socket: WebSocket;
        pusher: {
            server: PusherServer;
            client: PusherClient;
            mainChannel?: PusherClientChannel;
        };
        // weatherStartUnix: Collection<string, number>;
        lastNotificationHash: string;
        stockDebounceManager: StockDebounceManager;
        pendingRoleCreation: Collection<
            string,
            {
                itemId: string;
                itemName: string;
                itemType: string;
                itemHexColor: string;
            }
        >;
        currentEditingItemId: Collection<string, string>;
    }

    interface StoreRegistryEntries {
        'ws-messages': WebSocketMessageStore;
    }
}

declare module '@sapphire/framework' {
    interface ILogger {
        webhookError(builder: (builder: WebhookErrorBuilder) => WebhookErrorBuilder): Promise<void>;
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

        GUILD_ID: string;
        TRADING_CHANNEL_ID: string;
        LOGS_CHANNEL_ID: string;
        WFL_LOUNGE_CHANNEL_ID: string;

        DISCORD_TOKEN: string;
        DISCORD_WEBHOOK: string;

        DATABASE_URL: string;

        JSTUDIO_API_KEY: string;
        CRC_BOT_API_KEY: string;

        RENDER_INSTANCE_ID: string;

        PUSHER_APP_ID: string;
        PUSHER_APP_KEY: string;
        PUSHER_APP_SECRET: string;
        PUSHER_APP_CLUSTER: string;
    }
}
