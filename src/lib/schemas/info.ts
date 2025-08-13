import { z } from 'zod';

export const infoSchema = z.object({
    item_id: z.string({ required_error: 'item_id is required' }),
    display_name: z.string({ required_error: 'display_name is required' }),
    rarity: z.string().nullable(),
    currency: z.string().nullable(),
    price: z.string({ required_error: 'price is required' }),
    icon: z.string({ required_error: 'icon is required' }).url({ message: 'icon must be a valid URL' }),
    description: z.string({ required_error: 'description is required' }),
    duration: z.string({ required_error: 'duration is required' }),
    last_seen: z.string({ required_error: 'last_seen is required' }),
    type: z.string({ required_error: 'type is required' }),
});

export const infoSchemaArray = z.array(infoSchema);

export type Info = z.infer<typeof infoSchema>;
