import { valkey } from "./valkey";

interface RateLimitConfig {
	/** Maximum number of requests in the window */
	limit: number;
	/** Window size in seconds */
	window: number;
}

interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetAt: number; // Unix timestamp in seconds
	retryAfter?: number; // Seconds until allowed
}

/**
 * Sliding window rate limiter backed by Valkey.
 */
export async function checkRateLimit(
	key: string,
	config: RateLimitConfig,
): Promise<RateLimitResult> {
	const now = Math.floor(Date.now() / 1000);
	const windowStart = now - config.window;
	const redisKey = `ratelimit:${key}`;

	// Use a sorted set with timestamps as scores.
	// Remove entries outside the window, add the current request, and count.
	const pipeline = valkey.pipeline();
	pipeline.zremrangebyscore(redisKey, 0, windowStart);
	pipeline.zadd(redisKey, now, `${now}:${Math.random().toString(36).slice(2)}`);
	pipeline.zcard(redisKey);
	pipeline.expire(redisKey, config.window);

	const results = await pipeline.exec();
	if (!results) {
		return { allowed: true, remaining: config.limit - 1, resetAt: now + config.window };
	}

	const count = (results[2]?.[1] as number) ?? 0;
	const allowed = count <= config.limit;
	const remaining = Math.max(0, config.limit - count);
	const resetAt = now + config.window;

	if (!allowed) {
		// Remove the request we just added since it was denied
		// zadd result already recorded
		return {
			allowed: false,
			remaining: 0,
			resetAt,
			retryAfter: config.window,
		};
	}

	return { allowed, remaining, resetAt };
}

// Predefined rate limit configs per the tech stack doc
export const RATE_LIMITS = {
	/** Auth endpoints: 10 requests per minute per IP */
	auth: { limit: 10, window: 60 },
	/** Write endpoints: 30 requests per minute per user */
	write: { limit: 30, window: 60 },
	/** Read endpoints: 300 requests per minute per user */
	read: { limit: 300, window: 60 },
} as const;
