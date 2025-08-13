import { weatherSchema } from '@/lib/schemas/gag-ws';
import { WebSocketMessage, WebSocketMessageEvents } from '@/lib/structures/ws-message';
import { sendWeatherNotification } from '@/utils/handle-send-notification';
import { ApplyOptions } from '@sapphire/decorators';
import type { z } from 'zod';

@ApplyOptions<WebSocketMessage.Options>({
    event: WebSocketMessageEvents.Weather,
    schema: weatherSchema,
})
export class Handler extends WebSocketMessage {
    public run(data: z.infer<typeof this.schema>) {
        sendWeatherNotification(data);
    }
}
