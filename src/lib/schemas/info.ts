import { z } from 'zod';

export const infoSchema = z.object({
    item_id: z.string(),
    display_name: z.string(),
    rarity: z.string().nullable(),
    currency: z.string().nullable(),
    price: z.string(),
    icon: z.string().url(),
    description: z.string(),
    duration: z.string(),
    last_seen: z.string(),
    type: z.string(),
});

export const infoSchemaArray = z.array(infoSchema);

export type Info = z.infer<typeof infoSchema>;
