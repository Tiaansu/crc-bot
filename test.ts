import { ArrayString, envParseString, setup } from '@skyra/env-utilities';
import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

declare module '@skyra/env-utilities' {
    export interface Env {
        BOT_OWNER_IDS: ArrayString;
        SERVER_ADMIN_IDS: ArrayString;

        TRADING_CHANNEL_ID: string;
        LOGS_CHANNEL_ID: string;

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

setup('.env');

const pusherServer = new PusherServer({
    appId: envParseString('PUSHER_APP_ID'),
    key: envParseString('PUSHER_APP_KEY'),
    secret: envParseString('PUSHER_APP_SECRET'),
    cluster: envParseString('PUSHER_APP_CLUSTER'),
    useTLS: true,
});

const pusherClient = new PusherClient(envParseString('PUSHER_APP_KEY'), {
    cluster: envParseString('PUSHER_APP_CLUSTER'),
});

const channel = pusherClient.subscribe('crc-bot');

while (!channel.subscribed) {
    console.log('Waiting for pusher to connect...');
    await new Promise((resolve) => setTimeout(resolve, 50));
}

channel.bind('instance-changes', (data) => console.log(data));

setInterval(() => {
    pusherServer.trigger(
        'crc-bot',
        'instance-changes',
        Math.random().toString(),
    );
}, 250);
