import { container } from '@sapphire/pieces';
import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
    const isFromLocal = c.req.query('from_local');
    container.logger.info(
        `Pinged at ${new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Manila',
        })} ${isFromLocal ? '(from local)' : ''}`,
    );
    return c.json({
        message: 'Alive!',
    });
});

export default app;
