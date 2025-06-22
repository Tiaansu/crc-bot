export type ClientConfig = {
    isDev: boolean;
    ownerIds: string[];
    tradingChannelId: string;
    webhook: {
        id: string;
        token: string;
    };
};
