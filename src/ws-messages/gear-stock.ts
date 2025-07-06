import { stockSchema } from '@/lib/schemas/gag-ws';
import {
    WebSocketMessage,
    WebSocketMessageEvents,
} from '@/lib/structures/ws-message';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<WebSocketMessage.Options>({
    event: WebSocketMessageEvents.GearStock,
})
export class Handler extends WebSocketMessage {
    public run(rawData: unknown) {
        const data = this.parser(rawData, stockSchema);
        if (!data) return;

        this.container.stockDebounceManager.add('gear', data);
    }
}
