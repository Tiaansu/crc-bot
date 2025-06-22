export async function safeAwait<T, E = Error>(
    promise: Promise<T> | T,
): Promise<[null, T] | [E, null]> {
    try {
        const result = await promise;
        return [null, result];
    } catch (error) {
        return [error as E, null];
    }
}
