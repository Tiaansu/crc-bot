import { envParseString } from '@skyra/env-utilities';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const client = postgres(envParseString('DATABASE_URL'), { prepare: false });
export const db = drizzle({
    client,
    schema,
});
