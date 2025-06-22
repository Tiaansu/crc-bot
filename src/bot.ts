import '@/lib/setup';
import { container } from '@sapphire/pieces';
import { envParseString } from '@skyra/env-utilities';
import { Cron } from 'croner';
import { codeBlock, EmbedBuilder } from 'discord.js';
import { loadConfig } from './config';
import { BotClient } from './lib/bot-client';

function startHeartbeatCheck() {
    new Cron('0 * * * * *', () => {
        fetch(envParseString('HEARTBEAT_URL'))
            .then(() => console.log('Hit Heartbeat'))
            .catch(() => {});
    });
}

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

async function main(): Promise<void> {
    const client = new BotClient();

    try {
        handleErrors();
        startHeartbeatCheck();

        await client.login();
    } catch (error) {
        container.logger.fatal(error);
        await client.destroy();
        process.exit();
    }
}

void loadConfig();

await main().catch(container.logger.error.bind(container.logger));
