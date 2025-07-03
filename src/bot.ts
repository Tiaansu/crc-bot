import '@/lib/setup';
import { container } from '@sapphire/pieces';
import { envParseNumber } from '@skyra/env-utilities';
import { Cron } from 'croner';
import { loadConfig } from './config';
import { BotClient } from './lib/bot-client';
import server from './server';
import { handleWebsocket } from './utils/handle-websocket';

function startHeartbeat() {
    new Cron('*/30 * * * * *', async () => {
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

async function main(): Promise<void> {
    const client = new BotClient();

    try {
        startHeartbeat();
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
    port: envParseNumber('PORT'),
};
