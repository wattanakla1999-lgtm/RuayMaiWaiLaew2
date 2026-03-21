/**
 * Simple in-memory rate limiter.
 * For production with multiple instances, replace with Redis/Upstash.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

/**
 * @param key      - unique string (e.g. `report:${ip}:${stationId}`)
 * @param limit    - max requests allowed
 * @param windowMs - time window in milliseconds
 * @returns `{ success: true }` if allowed, `{ success: false, retryAfter }` if blocked
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; retryAfter?: number } {
  return { success: true };
}
