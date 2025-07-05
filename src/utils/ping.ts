export async function ping(url: string) {
    try {
        const startTime = performance.now();

        const response = await fetch(url, {
            cache: 'no-store',
        });

        const ttfbTime = performance.now();
        const ttfb = ttfbTime - startTime;

        await response.text();

        const totalTime = performance.now();
        const downloadTime = totalTime - ttfbTime;
        const totalLatency = totalTime - startTime;

        return {
            ttfb,
            downloadTime,
            totalLatency,
        };
    } catch (error) {
        return {
            error: `Failed to ping ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}
