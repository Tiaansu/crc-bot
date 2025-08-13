import { sendStockNotification } from '@/utils/handle-send-notification';
import { container } from '@sapphire/pieces';
import type { z } from 'zod';
import type { stockSchema } from '../schemas/gag-ws';

type StockData = z.infer<typeof stockSchema>;

export class StockDebounceManager {
    #lastSentStockState: {
        seed_stock: StockData;
        gear_stock: StockData;
    } = {
        seed_stock: [],
        gear_stock: [],
    };

    #pendingStockUpdates: {
        seed_stock: StockData | null;
        gear_stock: StockData | null;
    } = {
        seed_stock: null,
        gear_stock: null,
    };

    #processingTimer: NodeJS.Timeout | null = null;
    #DEBOUNCE_DELAY_MS = {
        Seed: 1_000,
        Gear: 50,
    };

    public constructor() {}

    public add(type: 'seed' | 'gear', data: StockData) {
        if (type === 'seed') {
            this.#pendingStockUpdates.seed_stock = data;
        } else if (type === 'gear') {
            this.#pendingStockUpdates.gear_stock = data;
        }

        if (this.#processingTimer) {
            clearTimeout(this.#processingTimer);
        }

        const delay = type === 'seed' ? this.#DEBOUNCE_DELAY_MS.Seed : this.#DEBOUNCE_DELAY_MS.Gear;
        this.#processingTimer = setTimeout(() => this.processAndResetStockBuffer(), delay);
    }

    private processAndResetStockBuffer() {
        container.logger.info(`Processing stock updates.`);

        if (!this.#pendingStockUpdates.seed_stock && !this.#pendingStockUpdates.gear_stock) {
            return;
        }

        const stockPayload = {
            seed_stock: this.#pendingStockUpdates.seed_stock ?? this.#lastSentStockState.seed_stock,
            gear_stock: this.#pendingStockUpdates.gear_stock ?? this.#lastSentStockState.gear_stock,
        };

        sendStockNotification(stockPayload);

        this.#lastSentStockState = stockPayload;
        this.#pendingStockUpdates = { seed_stock: null, gear_stock: null };
        this.#processingTimer = null;
    }
}
