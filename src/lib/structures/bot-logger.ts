import { container, Events, Result } from '@sapphire/framework';
import { Logger } from '@sapphire/plugin-logger';
import type { EmbedBuilder } from 'discord.js';
import WebhookErrorBuilder from './webhook-error-builder';

export class BotLogger extends Logger {
    public async webhookError(builder: (builder: WebhookErrorBuilder) => WebhookErrorBuilder): Promise<void> {
        const { webhook } = container.client;
        if (!webhook) return;

        const embed: EmbedBuilder = builder(new WebhookErrorBuilder()).build();

        const result = await Result.fromAsync(
            async () =>
                await webhook.send({
                    username: 'CRC Bot',
                    embeds: [embed],
                }),
        );

        result.inspectErr((error) => {
            container.client.emit(Events.Error, error as Error);
        });
    }
}
