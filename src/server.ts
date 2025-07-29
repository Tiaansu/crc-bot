import { container } from '@sapphire/pieces';
import { envParseString } from '@skyra/env-utilities';
import { Hono } from 'hono';
import WebSocket from 'ws';

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
    const apiKey = c.req.header('crc-bot-api-key');
    if (!apiKey) {
        return c.json({ message: 'Unauthorized' }, 401);
    }

    if (apiKey !== envParseString('CRC_BOT_API_KEY')) {
        return c.json({ message: 'Unauthorized' }, 401);
    }

    const from = c.req.query('from');

    if (!from) {
        return c.json({ message: 'Missing "from" parameter' }, 400);
    }

    if (container.socket.readyState === WebSocket.OPEN) {
        container.socket.close();
    }
    setTimeout(() => {
        process.exit(`New instance started. Instance: ${from}`);
    }, 100);

    return c.body(null, 204);
});

export default app;
