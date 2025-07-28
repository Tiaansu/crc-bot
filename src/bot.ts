import '@/lib/setup';
import { container } from '@sapphire/pieces';
import { Cron } from 'croner';
import { loadConfig } from './config';
import { BotClient } from './lib/bot-client';
import server from './server';
import { debugLockFile, handleWebsocket } from './utils/handle-websocket';

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

async function main(): Promise<void> {
    const client = new BotClient();

    try {
        debugLockFile();
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
    port: process.env.PORT ?? 10000,
    hostname: '0.0.0.0',
};
