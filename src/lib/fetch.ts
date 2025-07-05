import { API_URL } from '@/utils/constants';
import { createFetch, createSchema } from '@better-fetch/fetch';
import { infoSchemaArray } from './schemas/info';

const schema = createSchema({
    '/growagarden/info?type=weather': {
        output: infoSchemaArray,
    },
});

export const $fetch = createFetch({
    baseURL: API_URL,
    schema: schema,
    throw: true,
});
