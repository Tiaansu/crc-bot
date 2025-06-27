import { container } from '@sapphire/pieces';
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

export default app;
