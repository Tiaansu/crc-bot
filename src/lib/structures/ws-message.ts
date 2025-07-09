import { Option, type Awaitable } from '@sapphire/framework';
import { Piece } from '@sapphire/pieces';
import type { z, ZodTypeAny } from 'zod';

export abstract class WebSocketMessage<
    Options extends WebSocketMessage.Options = WebSocketMessage.Options,
> extends Piece<Options, 'ws-messages'> {
    public readonly event: WebSocketMessageEvents;
    public readonly schema: ZodTypeAny;

    public constructor(
        context: WebSocketMessage.LoaderContext,
        options: Options,
    ) {
        super(context, options);

        this.event = options.event;
        this.schema = options.schema;
    }

    public abstract run(parsedData: z.infer<typeof this.schema>): unknown;

    public parse(_rawData: unknown): Awaitable<Option<unknown>> {
        const { data, success, error } = this.schema.safeParse(_rawData);

        if (!success) {
            const errorMessage = Object.entries(error.flatten().fieldErrors)
                .map(([key, errors]) => `${key}: ${(errors ?? []).join(', ')}`)
                .join(' | ');
            this.container.logger.error(
                `WebSocket message parse error(${this.event}): ${errorMessage}`,
            );
            return this.none();
        }
        return this.some(data);
    }

    public some(): Option.Some<never>;
    public some<T>(data: T): Option.Some<T>;
    public some<T>(data?: T): Option.Some<T | undefined> {
        return Option.some(data);
    }

    public none(): Option.None {
        return Option.none;
    }
}

export interface WebSocketMessageOptions extends Piece.Options {
    readonly event: WebSocketMessageEvents;
    readonly schema: ZodTypeAny;
}

export type WebSocketMessageParseResult<Instance extends WebSocketMessage> =
    Option.UnwrapSome<Awaited<ReturnType<Instance['parse']>>>;

export namespace WebSocketMessage {
    export type LoaderContext = Piece.LoaderContext<'ws-messages'>;
    export type Options = WebSocketMessageOptions;
    export type ParseResult<Instance extends WebSocketMessage> =
        WebSocketMessageParseResult<Instance>;
}

export enum WebSocketMessageEvents {
    SeedStock = 'seed_stock',
    GearStock = 'gear_stock',
    EggStock = 'egg_stock',
    CosmeticStock = 'cosmetic_stock',
    EventShopStock = 'eventshop_stock',
    TravellingMerchantStock = 'travelingmerchant_stock',
    Notification = 'notification',
    Weather = 'weather',
}
