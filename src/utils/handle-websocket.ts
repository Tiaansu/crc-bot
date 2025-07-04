import {
    generalDataSchema,
    notificationSchema,
    stockSchema,
    weatherSchema,
} from '@/lib/schemas/gag-ws';
import { container } from '@sapphire/pieces';
import type { z, ZodTypeAny } from 'zod';
import {
    sendCosmeticStockNotification,
    sendEggStockNotification,
    sendEventStockNotification,
    sendNotification,
    sendStockNotification,
} from './handle-send-notification';

const WS_URL =
    'wss://websocket.joshlei.com/growagarden?user_id=1383283124376572086';
const RECONNECT_INTERVAL = 5_000;
const CONNECT_TIMEOUT = 10_000;

let ws: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
let connectTimeout: NodeJS.Timeout | null = null;

export function handleWebsocket() {
    container.logger.info('Attempting to connect to WebSocket server...');

    ws = new WebSocket(WS_URL);
    let isConnected = false;

    const cleanup = () => {
        if (ws) {
            ws.onopen = null;
            ws.onclose = null;
            ws.onmessage = null;
            ws.onerror = null;
            ws = null;
        }
    };

    ws.onopen = () => {
        isConnected = true;
        container.logger.info('Connected to WebSocket server.');

        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }
        if (connectTimeout) {
            clearTimeout(connectTimeout);
            connectTimeout = null;
        }
    };

    ws.onclose = (e) => {
        container.logger.warn(
            `Disconnected to WebSocket server. Reason: ${e.reason}`,
        );
        if (connectTimeout) {
            clearTimeout(connectTimeout);
            connectTimeout = null;
        }
        scheduleReconnect();
    };

    ws.onerror = (error) => {
        container.logger.error(`WebSocket error: ${error}`);
        if (!isConnected) {
            container.logger.warn(
                "Connection failed before 'open'. Scheduling reconnect...",
            );
            scheduleReconnect();
        }
    };

    connectTimeout = setTimeout(() => {
        if (ws?.readyState !== WebSocket.OPEN) {
            container.logger.warn(
                'Connection to WebSocket timeout. Forcing reconnect...',
            );
            cleanup();
            scheduleReconnect();
        }
    }, CONNECT_TIMEOUT);

    let stockUpdateBuffer: {
        seed_stock: z.infer<typeof stockSchema> | null;
        gear_stock: z.infer<typeof stockSchema> | null;
    } = {
        seed_stock: null,
        gear_stock: null,
    };

    let processingTimer: NodeJS.Timeout | null = null;
    const DEBOUNCE_DELAY_MS = 50;

    function processAndResetStockBuffer() {
        if (!stockUpdateBuffer.seed_stock && !stockUpdateBuffer.gear_stock) {
            return;
        }

        container.logger.info('Sending stock update.');
        sendStockNotification({
            seed_stock: stockUpdateBuffer.seed_stock ?? [],
            gear_stock: stockUpdateBuffer.gear_stock ?? [],
        });
        stockUpdateBuffer = { seed_stock: null, gear_stock: null };
        processingTimer = null;
    }

    ws.onmessage = (event) => {
        const { data: parsedData, success } = generalDataSchema.safeParse(
            JSON.parse(event.data),
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

        if (processingTimer) {
            clearTimeout(processingTimer);
        }

        switch (key) {
            case 'seed_stock': {
                const data = parser(parsedData[key], stockSchema);
                if (!data) return;

                stockUpdateBuffer.seed_stock = data;
                processingTimer = setTimeout(
                    processAndResetStockBuffer,
                    DEBOUNCE_DELAY_MS,
                );
                break;
            }
            case 'gear_stock': {
                const data = parser(parsedData[key], stockSchema);
                if (!data) return;

                stockUpdateBuffer.gear_stock = data;
                processingTimer = setTimeout(
                    processAndResetStockBuffer,
                    DEBOUNCE_DELAY_MS,
                );
                break;
            }
            case 'egg_stock': {
                const data = parser(parsedData[key], stockSchema);
                if (!data) return;

                container.logger.info('Sending egg stock update.');
                sendEggStockNotification(data);
                break;
            }
            case 'cosmetic_stock': {
                const data = parser(parsedData[key], stockSchema);
                if (!data) return;

                container.logger.info('Sending cosmetic stock update.');
                sendCosmeticStockNotification(data);
                break;
            }
            case 'eventshop_stock': {
                const data = parser(parsedData[key], stockSchema);
                if (!data) return;

                container.logger.info('Sending event shop stock update.');
                sendEventStockNotification(data);
                break;
            }
            case 'notification': {
                const data = parser(parsedData[key], notificationSchema);
                if (!data) return;

                container.logger.info('Sending notification.');
                sendNotification(data);
                break;
            }
            case 'weather': {
                const data = parser(parsedData[key], weatherSchema);
                if (!data) return;

                container.logger.info('Sending weather update.');
                // sendWeatherNotification(data);
                break;
            }
        }
    };

    function parser<T extends ZodTypeAny>(dataToParse: any[], parser: T) {
        const { data, success, error } = parser.safeParse(dataToParse);
        if (!success) {
            const errorMessage = Object.entries(error.flatten().fieldErrors)
                .map(([key, errors]) => `${key}: ${(errors ?? []).join(', ')}`)
                .join(' | ');
            container.logger.error(errorMessage);
            return null;
        }
        return data as z.infer<T>;
    }
}

function scheduleReconnect() {
    if (!reconnectTimeout) {
        reconnectTimeout = setTimeout(() => {
            reconnectTimeout = null;
            handleWebsocket();
        }, RECONNECT_INTERVAL);
    }
}
