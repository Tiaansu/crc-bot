import { Store } from '@sapphire/pieces';
import { Result } from '@sapphire/result';
import { WebSocketMessage, WebSocketMessageEvents } from './ws-message';

export class WebSocketMessageStore extends Store<WebSocketMessage, 'ws-messages'> {
    public constructor() {
        super(WebSocketMessage, { name: 'ws-messages' });
    }

    public async run(key: string, data: unknown) {
        if (this.size === 0) return;

        for (const handler of this.values()) {
            const filter = WebSocketMessageFilters.has(handler.event);

            if (!filter) continue;
            if (handler.event !== key) continue;

            const result = await Result.fromAsync(() => handler.parse(data));
            result.match({
                ok: (option) => {
                    option.match({
                        some: (value) => {
                            handler.run(value);
                        },
                        none: () => {
                            /* do nothing */
                        },
                    });
                },
                err: (error) => {
                    this.container.logger.error(error);
                },
            });
        }

        return true;
    }
}

export const WebSocketMessageFilters = new Set([
    WebSocketMessageEvents.SeedStock,
    WebSocketMessageEvents.GearStock,
    WebSocketMessageEvents.EggStock,
    WebSocketMessageEvents.CosmeticStock,
    WebSocketMessageEvents.EventShopStock,
    WebSocketMessageEvents.TravellingMerchantStock,
    WebSocketMessageEvents.Notification,
    WebSocketMessageEvents.Weather,
]);
