import { defineConfig } from 'drizzle-kit';

console.log(process.env.DATABASE_URL);

export default defineConfig({
    dialect: 'postgresql',
    schema: './src/lib/db/schema.ts',
    out: './drizzle/migrations',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
