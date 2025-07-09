export async function processInBatch<T, R>(
    items: T[],
    batchSize: number,
    fn: (item: T) => Promise<R>,
    progressCallback?: (processed: number, total: number) => any,
): Promise<R[]> {
    let results: R[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchPromise = batch.map(fn);
        const batchResults = await Promise.all(batchPromise);
        results = results.concat(batchResults);

        if (progressCallback) {
            progressCallback(
                Math.min(i + batchSize, items.length),
                items.length,
            );
        }
    }
    return results;
}
