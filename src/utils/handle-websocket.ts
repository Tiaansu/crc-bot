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
    sendNotification,
    sendStockNotification,
    sendWeatherNotification,
} from './handle-send-notification';

export function handleWebsocket() {
    const ws = new WebSocket(
        'wss://websocket.joshlei.com/growagarden?user_id=1383283124376572086',
    );

    ws.addEventListener('open', () => {
        container.logger.info(`Connected to Grow A Garden websocket server.`);
    });

    ws.addEventListener('close', () =>
        container.logger.info(
            `Disconnected from Grow A Garden websocket server.`,
        ),
    );

    ws.addEventListener('error', (error) =>
        container.logger.error(`WebSocket error: ${error}`),
    );

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

    ws.addEventListener('message', (event) => {
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

                sendEggStockNotification(data);
                break;
            }
            case 'cosmetic_stock': {
                const data = parser(parsedData[key], stockSchema);
                if (!data) return;

                sendCosmeticStockNotification(data);
                break;
            }
            case 'eventshop_stock': {
                const data = parser(parsedData[key], stockSchema);
                if (!data) return;

                break;
            }
            case 'notification': {
                const data = parser(parsedData[key], notificationSchema);
                if (!data) return;

                sendNotification(data);
                break;
            }
            case 'weather': {
                const data = parser(parsedData[key], weatherSchema);
                if (!data) return;

                sendWeatherNotification(data);
                break;
            }
        }
    });

    function parser<T extends ZodTypeAny>(dataToParse: any[], parser: T) {
        const { data, success } = parser.safeParse(dataToParse);
        if (!success) {
            return null;
        }
        return data as z.infer<T>;
    }
}
