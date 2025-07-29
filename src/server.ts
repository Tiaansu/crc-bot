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

app.post('/shutdown', (c) => {
    container.logger.info('Shutting down...');
    return c.json({
        message: 'Shutting down...',
    });
});

export default app;
