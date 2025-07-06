const regex = /^#([0-9a-f]{3}){1,2}$/i;

export function isValidHexString(hex: string): boolean {
    return regex.test(hex);
}
