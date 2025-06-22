import { ApiRequest, ApiResponse, Route } from '@sapphire/plugin-api';

export class BotRoutes extends Route {
    public async run(_request: ApiRequest, response: ApiResponse) {
        return response.json({
            message: 'Alive!',
        });
    }
}
