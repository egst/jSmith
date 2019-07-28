// Empty object check:
export const empty = obj => obj != null && Object.entries(obj).length === 0
// Iterable object check:
export const iterable = obj => obj != null && typeof obj[Symbol.iterator] === 'function'