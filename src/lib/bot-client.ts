import { CLIENT_OPTIONS } from '@/config';
import { Enumerable } from '@sapphire/decorators';
import { container, SapphireClient } from '@sapphire/framework';
import { WebhookClient } from 'discord.js';

export class BotClient extends SapphireClient {
    @Enumerable(false)
    public override readonly webhook: WebhookClient | null;

    public constructor() {
        super(CLIENT_OPTIONS);

        this.webhook = new WebhookClient(container.config.webhook);
    }

    public override async login(token?: string): Promise<string> {
        return await super.login(token);
    }

    public override async destroy(): Promise<void> {
        await super.destroy();
    }
}
