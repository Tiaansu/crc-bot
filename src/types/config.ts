export type ClientConfig = {
    isDev: boolean;
    ownerIds: string[];
    serverAdminIds: string[];
    guildId: string;
    tradingChannelId: string;
    logsChannelId: string;
    wflLoungeChannelId: string;
    webhook: {
        id: string;
        token: string;
    };
};
