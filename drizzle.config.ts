import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    dialect: 'postgresql',
    schema: './src/lib/db/schema.ts',
    out: './drizzle/migrations',
    dbCredentials: {
        url: process.env.DIRECT_DATABASE_URL!,
    },
});
