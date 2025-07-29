import { envParseString } from '@skyra/env-utilities';

const developmentRenderId = crypto.randomUUID();

export function getRenderId() {
    if (envParseString('NODE_ENV') === 'development') {
        return developmentRenderId;
    }
    return envParseString('RENDER_INSTANCE_ID').split('-').at(-1);
}
