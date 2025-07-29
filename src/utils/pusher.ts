import { container } from '@sapphire/pieces';
import { envParseString } from '@skyra/env-utilities';
import PusherServer from 'pusher';
import PusherClient from 'pusher-js';
import WebSocket from 'ws';
import { getRenderId } from './get-render-id';

export async function initializePusher() {
    container.logger.info('Initializing Pusher...');

    container.pusher = {
        server: new PusherServer({
            appId: envParseString('PUSHER_APP_ID'),
            key: envParseString('PUSHER_APP_KEY'),
            secret: envParseString('PUSHER_APP_SECRET'),
            cluster: envParseString('PUSHER_APP_CLUSTER'),
            useTLS: true,
        }),
        client: new PusherClient(envParseString('PUSHER_APP_KEY'), {
            cluster: envParseString('PUSHER_APP_CLUSTER'),
        }),
    };

    return new Promise(async (resolve) => {
        container.logger.info('Binding events...');

        container.pusher.mainChannel =
            container.pusher.client.subscribe('crc-bot');
        container.pusher.mainChannel.bind('instance-changes', (id: string) => {
            if (typeof id !== 'string') return resolve(1);

            if (id === getRenderId()) {
                container.logger.info('Skipping self.');
            } else {
                container.logger.info('Shutting down...');
                if (container.isFlaggedForShutdown) return resolve(2);

                if (container.socket.readyState === WebSocket.OPEN) {
                    container.socket.close(7000, 'Shutting down...');
                }
                container.isFlaggedForShutdown = true;
            }
            return resolve(0);
        });

        container.logger.info('Waiting for pusher to connect...');
        while (
            container.pusher.mainChannel &&
            !container.pusher.mainChannel.subscribed
        ) {
            /* do nothing */
            await new Promise((resolve) => setTimeout(resolve, 50));
        }

        container.logger.info('Pusher initialized.');
        container.logger.info('Checking for instance changes...');
        container.pusher.server.trigger(
            'crc-bot',
            'instance-changes',
            getRenderId(),
        );
    });
}
