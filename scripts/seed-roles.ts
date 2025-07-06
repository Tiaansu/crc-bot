import 'dotenv/config';
import { db } from '../src/lib/db';
import * as schema from '../src/lib/db/schema';
import { rolesToCreate } from '../src/lib/data/roles';

async function seedDatabase() {
    console.log('Seeding `roles_config` table...');

    try {
        const dataToInsert = rolesToCreate.map((item) => item);

        if (dataToInsert.length === 0) {
            console.log('No roles to seed. Exiting.');
            return;
        }

        console.log(`Preparing to insert ${dataToInsert.length} roles.`);

        await db
            .insert(schema.rolesConfig)
            .values(dataToInsert)
            .onConflictDoNothing();

        console.log('Seeding completed successfully.');
    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    }
}

seedDatabase().then(() => {
    process.exit(0);
});
