export type ClientConfig = {
    isDev: boolean;
    ownerIds: string[];
    serverAdminIds: string[];
    tradingChannelId: string;
    deletionChannelId: string;
    webhook: {
        id: string;
        token: string;
    };
};
