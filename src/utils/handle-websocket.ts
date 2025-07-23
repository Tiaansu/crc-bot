import { generalDataSchema } from '@/lib/schemas/gag-ws';
import { container } from '@sapphire/pieces';
import { envParseString } from '@skyra/env-utilities';

const WS_URL = `wss://websocket.joshlei.com/growagarden?user_id=1383283124376572086_instance_id_${getRenderInstanceId()}`;
const HEARTBEAT_CHECK = 5_000;

function getRenderInstanceId() {
    return (
        envParseString('RENDER_INSTANCE_ID').split('-').at(-1) ??
        Math.random().toString()
    );
}

export function handleWebsocket() {
    container.logger.info(`Connecting to WebSocket server... (url: ${WS_URL})`);
    container.socket = new WebSocket(WS_URL);

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
            JSON.parse(data),
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
