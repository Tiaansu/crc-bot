import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener, Store } from '@sapphire/framework';
import { envParseString } from '@skyra/env-utilities';
import { blue, gray, green, magenta, magentaBright, white, yellow } from 'colorette';
import { ActivityType, type Client } from 'discord.js';

@ApplyOptions<Listener.Options>({ once: true, event: Events.ClientReady })
export class BotListener extends Listener {
    private readonly style = this.isDev ? yellow : blue;

    public async run(client: Client) {
        this.printBanner(client);
        this.printStoreDebugInformation();

        this.setStatus(client);
        setInterval(() => this.setStatus(client), 30_000);
    }

    private setStatus(client: Client) {
        if (!client || !client.isReady) return;
        client.user?.setPresence({
            activities: [
                {
                    name: 'Chaz Roblox Community',
                    type: ActivityType.Watching,
                },
            ],
        });
    }

    private get isDev() {
        return envParseString('NODE_ENV') === 'development';
    }

    private printBanner(client: Client) {
        const success = green('+');
        const { logger } = this.container;

        const llc = this.isDev ? magentaBright : white;
        const blc = this.isDev ? magenta : blue;

        logger.info(' ');
        logger.info(`[${success}] Gateway`);
        if (this.isDev) {
            logger.info(`${blc('<')}${llc('/')}${blc('>')} ${llc('DEVELOPMENT MODE')}`);
        }
        logger.info(`[${success}] Logged in as ${client.user?.username}#${client.user?.discriminator}`);
        logger.info(' ');
    }

    private printStoreDebugInformation() {
        const { client, logger } = this.container;
        const stores = [...client.stores.values()];
        const last = stores.pop()!;

        for (const store of stores) logger.info(this.styleStore(store, false));
        logger.info(this.styleStore(last, true));
    }

    private styleStore(store: Store<any>, last: boolean) {
        return gray(`${last ? '└─' : '├─'} ${this.style(store.size.toString().padEnd(3, ' '))} ${store.name}`);
    }
}
