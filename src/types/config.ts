export type ClientConfig = {
    isDev: boolean;
    ownerIds: string[];
    serverAdminIds: string[];
    tradingChannelId: string;
    webhook: {
        id: string;
        token: string;
    };
};
