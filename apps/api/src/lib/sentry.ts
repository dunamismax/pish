import * as Sentry from "@sentry/bun";
import { env } from "./env";

export function initSentry() {
	if (!env.SENTRY_DSN) {
		console.log("[sentry] no DSN configured, skipping initialization");
		return;
	}

	Sentry.init({
		dsn: env.SENTRY_DSN,
		environment: env.NODE_ENV,
		tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0,
		// 100% error sampling
		beforeSend(event) {
			// Scrub sensitive data
			if (event.request?.headers) {
				delete event.request.headers.cookie;
				delete event.request.headers.authorization;
			}
			return event;
		},
	});

	console.log("[sentry] initialized");
}

export { Sentry };
