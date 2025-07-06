import { stockSchema } from '@/lib/schemas/gag-ws';
import {
    WebSocketMessage,
    WebSocketMessageEvents,
} from '@/lib/structures/ws-message';
import { sendEventStockNotification } from '@/utils/handle-send-notification';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<WebSocketMessage.Options>({
    event: WebSocketMessageEvents.EventShopStock,
})
export class Handler extends WebSocketMessage {
    public run(rawData: unknown) {
        const data = this.parser(rawData, stockSchema);
        if (data) sendEventStockNotification(data);
    }
}
