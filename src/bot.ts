import '@/lib/setup';
import { container } from '@sapphire/pieces';
import { codeBlock, EmbedBuilder } from 'discord.js';
import { loadConfig } from './config';
import { BotClient } from './lib/bot-client';
import server from './server';
import { envParseNumber } from '@skyra/env-utilities';
import { Cron } from 'croner';

function handleErrors() {
    process.on('unhandledRejection', (reason) => {
        const { client } = container;

        if (!client.webhook) return;

        client.webhook.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Unhandled Rejection')
                    .setColor('Red')
                    .setDescription(`${codeBlock(reason as string)}`),
            ],
            username: client.user?.username ?? 'CRC',
        });
    });

    process.on('uncaughtException', (err, origin) => {
        const { client } = container;

        if (!client.webhook) return;

        client.webhook.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Uncaught Exception')
                    .setColor('Red')
                    .setDescription(`${origin}: ${codeBlock(err.stack!)}`),
            ],
            username: client.user?.username ?? 'CRC',
        });
    });
}

function startHeartbeat() {
    new Cron('*/30 * * * * *', async () => {
        try {
            const response = await fetch(
                'https://crc-bot.onrender.com?from_local=true',
            );

            if (!response.ok) {
                container.logger.error('Heartbeat failed');
            }
        } catch (error) {
            container.logger.error(
                `Failed to send heartbeat: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    });
}

async function main(): Promise<void> {
    const client = new BotClient();

    try {
        handleErrors();
        startHeartbeat();

        await client.login();
    } catch (error) {
        container.logger.fatal(error);
        await client.destroy();
        process.exit();
    }
}

void loadConfig();

await main().catch(container.logger.error.bind(container.logger));

export default {
    fetch: server.fetch,
    port: envParseNumber('PORT'),
};
