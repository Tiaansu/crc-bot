import { container } from '@sapphire/pieces';

export function flagForShutdown(status: boolean) {
    container.isFlaggedForShutdown = status;
}

export function isFlaggedForShutdown() {
    return container.isFlaggedForShutdown;
}
