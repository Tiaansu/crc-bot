import 'dotenv/config';
import { db } from '../src/lib/db';
import * as schema from '../src/lib/db/schema';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

const client = postgres(process.env.OLD_DATABASE_URL!, { prepare: false });
const oldDb = drizzle({
    client,
    schema,
});

async function migrateDatas() {
    const start = Date.now();
    {
        console.log(`Getting roles_config data...`);
        const data = await oldDb.select().from(schema.rolesConfig);
        await db.insert(schema.rolesConfig).values(data);
        console.log(`Done with roles_config`);
    }
    {
        console.log(`Getting roles data...`);
        const data = await oldDb.select().from(schema.roles);
        await db.insert(schema.roles).values(data);
        console.log(`Done with roles`);
    }
    {
        console.log(`Getting role_pickers data...`);
        const data = await oldDb.select().from(schema.rolePickers);
        await db.insert(schema.rolePickers).values(data);
        console.log(`Done with role_pickers`);
    }
    {
        console.log(`Getting channels data...`);
        const data = await oldDb.select().from(schema.channels);
        await db.insert(schema.channels).values(data);
        console.log(`Done with channels`);
    }
    const end = Date.now();
    console.log(`Done in ${end - start}ms`);
}

migrateDatas().then(() => process.exit(0));
