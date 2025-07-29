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

app.post('/shutdown', (c) => {
    container.logger.info(
        'Shutting down...' +
            envParseString('RENDER_INSTANCE_ID').split('-').at(-1),
    );
    return c.json({
        message:
            'Shutting down...' +
            envParseString('RENDER_INSTANCE_ID').split('-').at(-1),
    });
});

export default app;
