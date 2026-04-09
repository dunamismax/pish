import { Elysia } from "elysia";
import type { Session, User } from "lucia";
import { lucia } from "../lib/auth";

/**
 * Auth middleware that reads the session cookie, validates the session,
 * and attaches user + session to the Elysia context.
 *
 * Does NOT reject unauthenticated requests - use `requireAuth` for that.
 */
export const sessionMiddleware = new Elysia({ name: "session" }).derive(
	{ as: "global" },
	async ({ cookie }): Promise<{ user: User | null; session: Session | null }> => {
		const cookieValue = cookie[lucia.sessionCookieName]?.value;
		const sessionId = typeof cookieValue === "string" ? cookieValue : null;

		if (!sessionId) {
			return { user: null, session: null };
		}

		const { session, user } = await lucia.validateSession(sessionId);

		if (session?.fresh) {
			// Session was refreshed, update the cookie
			const sessionCookie = lucia.createSessionCookie(session.id);
			cookie[lucia.sessionCookieName]?.set({
				value: sessionCookie.value,
				...sessionCookie.attributes,
			});
		}

		if (!session) {
			// Session was invalid, clear the cookie
			const blankCookie = lucia.createBlankSessionCookie();
			cookie[lucia.sessionCookieName]?.set({
				value: blankCookie.value,
				...blankCookie.attributes,
			});
		}

		return { user, session };
	},
);

/**
 * Guard that requires a valid authenticated session.
 * Returns 401 for unauthenticated requests.
 */
export const requireAuth = new Elysia({ name: "requireAuth" })
	.use(sessionMiddleware)
	.onBeforeHandle(({ user, set }) => {
		if (!user) {
			set.status = 401;
			return {
				ok: false,
				error: { code: "UNAUTHORIZED", message: "Authentication required" },
			};
		}
	});

/**
 * Guard that requires a specific minimum role.
 */
export function requireRole(...roles: string[]) {
	return new Elysia({ name: `requireRole:${roles.join(",")}` })
		.use(requireAuth)
		.onBeforeHandle(({ user, set }) => {
			if (!user || !roles.includes(user.role)) {
				set.status = 403;
				return {
					ok: false,
					error: { code: "FORBIDDEN", message: "Insufficient permissions" },
				};
			}
		});
}
