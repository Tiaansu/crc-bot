import { API_URL } from '@/utils/constants';
import { createFetch, createSchema } from '@better-fetch/fetch';
import { envParseString } from '@skyra/env-utilities';
import { infoSchemaArray } from './schemas/info';

const schema = createSchema({
    '/growagarden/info?type=weather': {
        output: infoSchemaArray,
    },
});

export const $fetch = createFetch({
    baseURL: API_URL,
    headers: {
        'jstudio-key': envParseString('JSTUDIO_API_KEY'),
    },
    schema: schema,
    throw: true,
});
