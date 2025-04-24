export const isPlainObject = (obj: any) => {
    if (typeof obj !== 'object' || obj === null) return false;
    return Object.getPrototypeOf(obj) === Object.prototype;
}