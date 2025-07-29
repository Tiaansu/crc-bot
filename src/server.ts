import { container } from '@sapphire/pieces';
import { envParseString } from '@skyra/env-utilities';
import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
    const from = c.req.query('from');
    container.logger.info(
        `Pinged at ${new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Manila',
        })} ${from ?? '(unknown)'}`,
    );
    return c.json({
        message: 'Alive!',
    });
});

app.get('/id', (c) => {
    const apiKey = c.req.header('CRC-BOT-API-KEY');
    if (!apiKey) {
        return c.json({ error: 'Missing API key' }, 401);
    }

    if (apiKey !== envParseString('CRC_BOT_API_KEY')) {
        return c.json({ error: 'Invalid API key' }, 401);
    }

    const instanceId = envParseString('RENDER_INSTANCE_ID');

    if (instanceId === 'render_instance_id_is_invalid_in_development') {
        return c.json({ error: 'This is a development instance' }, 403);
    }

    const id = instanceId.split('-').at(-1);

    if (!id) {
        return c.json(
            { error: 'Something went wrong... Please try again' },
            500,
        );
    }

    return c.json({
        instanceId: id,
    });
});

export default app;
