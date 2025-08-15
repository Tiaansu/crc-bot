import '@/lib/setup';
import { container } from '@sapphire/pieces';
import { loadConfig } from './config';
import { BotClient } from './lib/bot-client';
import { handleWebsocket } from './utils/handle-websocket';

async function main(): Promise<void> {
    const client = new BotClient();

    try {
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
