import { z } from 'zod';

export const generalDataSchema = z.record(z.string(), z.array(z.any()));

export const stockSchema = z.array(
    z.object({
        item_id: z.string({
            required_error: 'item_id is required',
        }),
        display_name: z.string({
            required_error: 'display_name is required',
        }),
        quantity: z.number({
            required_error: 'quantity is required',
        }),
        start_date_unix: z.number({
            required_error: 'start_date_unix is required',
        }),
        end_date_unix: z.number({
            required_error: 'end_date_unix is required',
        }),
        Date_Start: z.string({
            required_error: 'Date_Start is required',
        }),
        Date_End: z.string({
            required_error: 'Date_End is required',
        }),
        icon: z
            .string({
                required_error: 'icon is required',
            })
            .url({
                message: 'icon must be a valid URL',
            }),
    }),
);

export const weatherSchema = z.array(
    z.object({
        weather_id: z.string({
            required_error: 'weather_id is required',
        }),
        weather_name: z.string({
            required_error: 'weather_name is required',
        }),
        start_duration_unix: z.number({
            required_error: 'start_duration_unix is required',
        }),
        end_duration_unix: z.number({
            required_error: 'end_duration_unix is required',
        }),
        active: z.boolean({
            required_error: 'active is required',
        }),
        duration: z.number({
            required_error: 'duration is required',
        }),
        icon: z.string().optional(),
    }),
);

export const travellingMerchantSchema = z.object({
    merchantName: z.string(),
    stocks: stockSchema,
});

export const notificationSchema = z.array(
    z.object({
        message: z.string({
            required_error: 'message is required',
        }),
        timestamp: z.number({
            required_error: 'timestamp is required',
        }),
        end_timestamp: z.number().optional(),
    }),
);
