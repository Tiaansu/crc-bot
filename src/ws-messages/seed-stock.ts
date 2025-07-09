import { stockSchema } from '@/lib/schemas/gag-ws';
import {
    WebSocketMessage,
    WebSocketMessageEvents,
} from '@/lib/structures/ws-message';
import { ApplyOptions } from '@sapphire/decorators';
import type { z } from 'zod';

@ApplyOptions<WebSocketMessage.Options>({
    event: WebSocketMessageEvents.SeedStock,
    schema: stockSchema,
})
export class Handler extends WebSocketMessage {
    public run(data: z.infer<typeof this.schema>) {
        this.container.stockDebounceManager.add('seed', data);
    }
}
