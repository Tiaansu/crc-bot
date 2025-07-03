import { z } from 'zod';

export const generalDataSchema = z.record(z.string(), z.array(z.any()));

export const stockSchema = z.array(
    z.object({
        item_id: z.string(),
        display_name: z.string(),
        quantity: z.number(),
        start_date_unix: z.number(),
        end_date_unix: z.number(),
        Date_Start: z.string(),
        Date_End: z.string(),
        icon: z.string().url(),
    }),
);

export const weatherSchema = z.array(
    z.object({
        weather_id: z.string(),
        weather_name: z.string(),
        start_duration_unix: z.number(),
        end_duration_unix: z.number(),
        active: z.boolean(),
        duration: z.number(),
        icon: z.string().url(),
    }),
);

export const notificationSchema = z.array(
    z.object({
        message: z.string(),
        timestamp: z.number(),
        end_timestamp: z.number().optional(),
    }),
);
