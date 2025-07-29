import '@/lib/setup';
import { betterFetch, BetterFetchError } from '@better-fetch/fetch';
import { container } from '@sapphire/pieces';
import { envParseString } from '@skyra/env-utilities';
import { Cron } from 'croner';
import { loadConfig } from './config';
import { BotClient } from './lib/bot-client';
import server from './server';
import { handleWebsocket } from './utils/handle-websocket';

function startHeartbeat() {
    new Cron('0 */14 * * * *', async () => {
        try {
            const response = await fetch(
                'https://crc-bot.onrender.com?from=local',
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

async function shutdownPreviousInstance() {
    try {
        const response = await betterFetch<{
            message: string;
        }>('https://crc-bot.onrender.com/shutdown', {
            method: 'POST',
            headers: {
                'crc-bot-api-key': envParseString('CRC_BOT_API_KEY'),
            },
        });

        if (response.error) {
            throw response.error;
        }

        container.logger.info(
            `[${envParseString('RENDER_INSTANCE_ID').split('-').at(-1)}]: ${response.data['message']}`,
        );
    } catch (error) {
        if (error instanceof BetterFetchError) {
            return; // ignore
        }
        container.logger.error(error);
    }
}

async function main(): Promise<void> {
    const client = new BotClient();

    try {
        startHeartbeat();
        shutdownPreviousInstance();
        handleWebsocket();

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
    port: process.env.PORT ?? 10000,
    hostname: '0.0.0.0',
};
