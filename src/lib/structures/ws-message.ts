import { Piece } from '@sapphire/pieces';
import type { z, ZodTypeAny } from 'zod';

export abstract class WebSocketMessage<
    Options extends WebSocketMessage.Options = WebSocketMessage.Options,
> extends Piece<Options, 'ws-messages'> {
    public readonly event: WebSocketMessageEvents;

    public constructor(
        context: WebSocketMessage.LoaderContext,
        options: Options,
    ) {
        super(context, options);

        this.event = options.event;
    }

    public abstract run(data: unknown): unknown;

    public parser<T extends ZodTypeAny>(dataToParse: unknown, parser: T) {
        const { data, success, error } = parser.safeParse(dataToParse);

        if (!success) {
            const errorMessage = Object.entries(error.flatten().fieldErrors)
                .map(([key, errors]) => `${key}: ${(errors ?? []).join(', ')}`)
                .join(' | ');
            this.container.logger.error(errorMessage);
            return null;
        }
        return data as z.infer<T>;
    }
}

export interface WebSocketMessageOptions extends Piece.Options {
    readonly event: WebSocketMessageEvents;
}

export namespace WebSocketMessage {
    export type LoaderContext = Piece.LoaderContext<'ws-messages'>;
    export type Options = WebSocketMessageOptions;
}

export enum WebSocketMessageEvents {
    SeedStock = 'seed_stock',
    GearStock = 'gear_stock',
    EggStock = 'egg_stock',
    CosmeticStock = 'cosmetic_stock',
    EventShopStock = 'eventshop_stock',
    TravelingMerchantStock = 'travelingmerchant_stock',
    Notification = 'notification',
    Weather = 'weather',
}
