import { CLIENT_OPTIONS } from '@/config';
import { Enumerable } from '@sapphire/decorators';
import { container, SapphireClient } from '@sapphire/framework';
import { Collection, WebhookClient } from 'discord.js';
import { StockDebounceManager } from './structures/stock-debounce-manager';
import { WebSocketMessageStore } from './structures/ws-message-store';

export class BotClient extends SapphireClient {
    @Enumerable(false)
    public override readonly webhook: WebhookClient | null;

    public constructor() {
        super(CLIENT_OPTIONS);

        this.webhook = new WebhookClient(container.config.webhook);
        this.initializeCollections();
        this.registerCogs();

        container.stores.register(new WebSocketMessageStore());
    }

    public override async login(token?: string): Promise<string> {
        return await super.login(token);
    }

    public override async destroy(): Promise<void> {
        await super.destroy();
        if (container.socket.readyState === WebSocket.OPEN) {
            container.socket.terminate();
        }
    }

    private initializeCollections() {
        // container.weatherStartUnix = new Collection();
        container.pendingRoleCreation = new Collection();
        container.currentEditingItemId = new Collection();
        container.stockDebounceManager = new StockDebounceManager();
        container.stickyMessageTimeouts = new Collection();
        container.stickyMessageQueue = new Set();
    }

    private registerCogs() {}
}
