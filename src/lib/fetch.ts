import { API_URL } from '@/utils/constants';
import { createFetch } from '@better-fetch/fetch';

export const $fetch = createFetch({
    baseURL: API_URL,
    throw: true,
});
