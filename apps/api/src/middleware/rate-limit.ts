import { Elysia } from "elysia";
import { checkRateLimit, RATE_LIMITS } from "../lib/rate-limit";

/**
 * Rate limiting middleware for auth endpoints.
 * Limits by IP address using sliding window algorithm.
 */
export const authRateLimit = new Elysia({ name: "authRateLimit" }).onBeforeHandle(
	async ({ set, request }) => {
		const ip =
			request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
			request.headers.get("x-real-ip") ||
			"unknown";

		const result = await checkRateLimit(`auth:${ip}`, RATE_LIMITS.auth);

		set.headers["X-RateLimit-Limit"] = String(RATE_LIMITS.auth.limit);
		set.headers["X-RateLimit-Remaining"] = String(result.remaining);
		set.headers["X-RateLimit-Reset"] = String(result.resetAt);

		if (!result.allowed) {
			set.status = 429;
			set.headers["Retry-After"] = String(result.retryAfter ?? RATE_LIMITS.auth.window);
			return {
				ok: false as const,
				error: { code: "RATE_LIMITED", message: "Too many requests. Try again later." },
			};
		}
	},
);
