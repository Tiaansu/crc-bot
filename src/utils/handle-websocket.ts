import { generalDataSchema } from '@/lib/schemas/gag-ws';
import { container } from '@sapphire/pieces';
import { envParseString } from '@skyra/env-utilities';
import { WebSocket } from 'ws';

const WS_URL = `wss://websocket.joshlei.com/growagarden?user_id=1383283124376572086${envParseString('NODE_ENV') === 'development' ? '_dev' : ''}`;
const HEARTBEAT_CHECK = 5_000;

export async function getInstanceId() {
    try {
        const response = await fetch('https://crc-bot.onrender.com/id', {
            headers: {
                'CRC-BOT-API-KEY': envParseString('CRC_BOT_API_KEY'),
            },
        });

        if (!response.ok) {
            throw new Error('Failed to get instance ID');
        }

        const json = await response.json();
        const instanceId = json.instanceId;

        const currentInstanceId = envParseString('RENDER_INSTANCE_ID')
            .split('-')
            .at(-1);

        if (instanceId !== currentInstanceId) {
            container.logger.info(
                `There must be a new instance. Instance ID: ${instanceId}`,
            );
            container.logger.info(`Current instance ID: ${currentInstanceId}`);
            container.logger.info(`Disconnecting the current websocket...`);

            if (container.socket.readyState === WebSocket.OPEN) {
                container.socket.close();
            }
        } else {
            container.logger.info(`Instance ID: ${instanceId}`);
        }

        return true;
    } catch (error) {
        container.logger.error(error);
        return false;
    }
}

export function handleWebsocket() {
    container.logger.info(`Connecting to WebSocket server... (url: ${WS_URL})`);
    const socket = new WebSocket(WS_URL, {
        headers: {
            'jstudio-key': envParseString('JSTUDIO_API_KEY'),
        },
    });
    container.socket = socket;

    setInterval(() => {
        if (container.socket.readyState === WebSocket.CLOSED) {
            container.logger.warn('WebSocket is closed. Reconnecting...');
            handleWebsocket();
        }
    }, HEARTBEAT_CHECK);

    container.socket.addEventListener('open', () => {
        container.logger.info('Connected to WebSocket server.');
    });

    container.socket.addEventListener('close', (e) => {
        container.logger.info(
            `Disconnected from WebSocket server. Code: ${e.code} Reason: ${e.reason}`,
        );
    });

    container.socket.addEventListener('error', (error) => {
        container.logger.error(`WebSocket error: ${error}`);
    });

    container.socket.addEventListener('message', ({ data }) => {
        const { data: parsedData, success } = generalDataSchema.safeParse(
            JSON.parse(data.toString()),
        );

        if (!success) {
            return;
        }

        const keys = Object.keys(parsedData);
        // We only care about one key
        if (keys.length !== 1) {
            container.logger.info(`Data received.`);
            return;
        }
        const key: string = keys[0];

        container.logger.info(`Received data for ${key}.`);
        container.stores.get('ws-messages').run(key, parsedData[key]);
    });
}
