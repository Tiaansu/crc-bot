import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({
    path: process.env.ENV_FILE || '.env.production.local',
});

export default defineConfig({
    dialect: 'postgresql',
    schema: './src/lib/db/schema.ts',
    out: './drizzle/migrations',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
