import { generalDataSchema } from '@/lib/schemas/gag-ws';
import { container } from '@sapphire/pieces';
import { envParseString } from '@skyra/env-utilities';
import fs, { readFileSync } from 'node:fs';
import path from 'node:path';
import { WebSocket } from 'ws';

const WS_URL = `wss://websocket.joshlei.com/growagarden?user_id=1383283124376572086${envParseString('NODE_ENV') === 'development' ? '_dev' : ''}`;
const HEARTBEAT_CHECK = 5_000;
const LOCK_FILE = path.join(process.cwd(), 'render.lock');

export function debugLockFile() {
    if (fs.existsSync(LOCK_FILE)) {
        try {
            const lockData = JSON.parse(readFileSync(LOCK_FILE, 'utf-8'));
            container.logger.info(JSON.stringify(lockData, null, 4));
        } catch (error) {
            container.logger.error(error);
        }
    }

    fs.writeFileSync(
        LOCK_FILE,
        JSON.stringify({
            pid: process.pid,
            timestamp: Date.now(),
        }),
    );

    process.on('exit', () => {
        try {
            fs.unlinkSync(LOCK_FILE);
        } catch (error) {
            container.logger.error(error);
        }
    });
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
