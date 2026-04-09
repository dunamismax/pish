import * as arctic from "arctic";
import { Elysia, t } from "elysia";
import { lucia } from "../lib/auth";
import { sql } from "../lib/db";
import { sendPasswordResetEmail, sendVerificationEmail } from "../lib/email";
import { env } from "../lib/env";
import { apple, google } from "../lib/oauth";
import { hashPassword, verifyPassword } from "../lib/password";
import {
	createEmailVerificationToken,
	createPasswordResetToken,
	validateEmailVerificationToken,
	validatePasswordResetToken,
} from "../lib/tokens";
import { sessionMiddleware } from "../middleware/auth";
import { authRateLimit } from "../middleware/rate-limit";

export const authRoutes = new Elysia({ prefix: "/api/auth" })
	.use(sessionMiddleware)
	.use(authRateLimit)

	// ─── Sign Up ─────────────────────────────────────────────────────
	.post(
		"/signup",
		async ({ body, set, cookie }) => {
			const { email, username, password } = body;

			// Check uniqueness
			const existingEmail = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
			if (existingEmail.length > 0) {
				set.status = 409;
				return { ok: false, error: { code: "EMAIL_TAKEN", message: "Email already in use" } };
			}

			const existingUsername =
				await sql`SELECT id FROM users WHERE username = ${username.toLowerCase()}`;
			if (existingUsername.length > 0) {
				set.status = 409;
				return {
					ok: false,
					error: { code: "USERNAME_TAKEN", message: "Username already in use" },
				};
			}

			const passwordHash = await hashPassword(password);

			const rows = await sql`
				INSERT INTO users (email, username, password_hash, role, account_status)
				VALUES (${email.toLowerCase()}, ${username.toLowerCase()}, ${passwordHash}, 'new_user', 'new_user')
				RETURNING id
			`;

			const userId = rows[0].id;

			// Create verification token and send email
			const token = await createEmailVerificationToken(userId);
			await sendVerificationEmail(email, username, token);

			// Create session
			const session = await lucia.createSession(userId, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			cookie[lucia.sessionCookieName]?.set({
				value: sessionCookie.value,
				...sessionCookie.attributes,
			});

			return {
				ok: true,
				data: { userId, message: "Account created. Check your email to verify." },
			};
		},
		{
			body: t.Object({
				email: t.String({ format: "email" }),
				username: t.String({ minLength: 3, maxLength: 30, pattern: "^[a-zA-Z0-9_-]+$" }),
				password: t.String({ minLength: 8, maxLength: 128 }),
			}),
		},
	)

	// ─── Sign In ─────────────────────────────────────────────────────
	.post(
		"/signin",
		async ({ body, set, cookie }) => {
			const { email, password } = body;

			const rows = await sql`
				SELECT id, password_hash, account_status
				FROM users
				WHERE email = ${email.toLowerCase()}
			`;

			if (rows.length === 0 || !rows[0].password_hash) {
				set.status = 401;
				return {
					ok: false,
					error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
				};
			}

			const user = rows[0];

			if (user.account_status === "banned") {
				set.status = 403;
				return {
					ok: false,
					error: { code: "ACCOUNT_BANNED", message: "This account has been suspended" },
				};
			}

			const valid = await verifyPassword(user.password_hash, password);
			if (!valid) {
				set.status = 401;
				return {
					ok: false,
					error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
				};
			}

			const session = await lucia.createSession(user.id, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			cookie[lucia.sessionCookieName]?.set({
				value: sessionCookie.value,
				...sessionCookie.attributes,
			});

			return { ok: true, data: { userId: user.id } };
		},
		{
			body: t.Object({
				email: t.String({ format: "email" }),
				password: t.String({ minLength: 1 }),
			}),
		},
	)

	// ─── Sign Out ────────────────────────────────────────────────────
	.post("/signout", async ({ session, cookie }) => {
		if (session) {
			await lucia.invalidateSession(session.id);
		}

		const blankCookie = lucia.createBlankSessionCookie();
		cookie[lucia.sessionCookieName]?.set({
			value: blankCookie.value,
			...blankCookie.attributes,
		});

		return { ok: true, data: { message: "Signed out" } };
	})

	// ─── Session / Current User ──────────────────────────────────────
	.get("/me", ({ user }) => {
		if (!user) {
			return { ok: true, data: null };
		}
		return {
			ok: true,
			data: {
				id: user.id,
				email: user.email,
				username: user.username,
				displayName: user.displayName,
				role: user.role,
				accountStatus: user.accountStatus,
				emailVerified: user.emailVerified,
				avatarUrl: user.avatarUrl,
			},
		};
	})

	// ─── Email Verification ──────────────────────────────────────────
	.get("/verify-email", async ({ query, set }) => {
		const token = query.token;
		if (!token) {
			set.status = 400;
			return { ok: false, error: { code: "MISSING_TOKEN", message: "Token is required" } };
		}

		const userId = await validateEmailVerificationToken(token);
		if (!userId) {
			set.status = 400;
			return {
				ok: false,
				error: { code: "INVALID_TOKEN", message: "Invalid or expired token" },
			};
		}

		await sql`UPDATE users SET email_verified = TRUE WHERE id = ${userId}`;

		// Upgrade new_user to user if email verified
		await sql`
			UPDATE users SET role = 'user', account_status = 'active'
			WHERE id = ${userId} AND role = 'new_user'
		`;

		// Redirect to app
		set.redirect = `${env.BASE_URL}/app/dashboard?verified=true`;
	})

	// ─── Resend Verification ─────────────────────────────────────────
	.post("/resend-verification", async ({ user, set }) => {
		if (!user) {
			set.status = 401;
			return {
				ok: false,
				error: { code: "UNAUTHORIZED", message: "Authentication required" },
			};
		}
		if (user.emailVerified) {
			return { ok: true, data: { message: "Email already verified" } };
		}

		const token = await createEmailVerificationToken(user.id);
		await sendVerificationEmail(user.email, user.username, token);

		return { ok: true, data: { message: "Verification email sent" } };
	})

	// ─── Forgot Password ────────────────────────────────────────────
	.post(
		"/forgot-password",
		async ({ body }) => {
			const { email } = body;

			const rows = await sql`SELECT id, username FROM users WHERE email = ${email.toLowerCase()}`;

			// Always return success to prevent email enumeration
			if (rows.length > 0) {
				const user = rows[0];
				const token = await createPasswordResetToken(user.id);
				await sendPasswordResetEmail(email, user.username, token);
			}

			return { ok: true, data: { message: "If the email exists, a reset link was sent." } };
		},
		{
			body: t.Object({
				email: t.String({ format: "email" }),
			}),
		},
	)

	// ─── Reset Password ─────────────────────────────────────────────
	.post(
		"/reset-password",
		async ({ body, set }) => {
			const { token, password } = body;

			const userId = await validatePasswordResetToken(token);
			if (!userId) {
				set.status = 400;
				return {
					ok: false,
					error: { code: "INVALID_TOKEN", message: "Invalid or expired reset token" },
				};
			}

			const passwordHash = await hashPassword(password);
			await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${userId}`;

			// Invalidate all sessions for security
			await lucia.invalidateUserSessions(userId);

			return { ok: true, data: { message: "Password reset successful. Please sign in." } };
		},
		{
			body: t.Object({
				token: t.String({ minLength: 1 }),
				password: t.String({ minLength: 8, maxLength: 128 }),
			}),
		},
	)

	// ─── Google OAuth: Redirect ──────────────────────────────────────
	.get("/google", async ({ cookie, set }) => {
		const state = arctic.generateState();
		const codeVerifier = arctic.generateCodeVerifier();

		cookie.google_oauth_state?.set({
			value: state,
			path: "/",
			httpOnly: true,
			secure: env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 10,
		});

		cookie.google_code_verifier?.set({
			value: codeVerifier,
			path: "/",
			httpOnly: true,
			secure: env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 10,
		});

		const url = google.createAuthorizationURL(state, codeVerifier, ["openid", "profile", "email"]);
		set.redirect = url.toString();
	})

	// ─── Google OAuth: Callback ──────────────────────────────────────
	.get("/callback/google", async ({ query, cookie, set }) => {
		const code = query.code;
		const state = query.state;
		const storedState = String(cookie.google_oauth_state?.value ?? "");
		const codeVerifier = String(cookie.google_code_verifier?.value ?? "");

		if (!code || !state || !storedState || state !== storedState || !codeVerifier) {
			set.status = 400;
			return { ok: false, error: { code: "INVALID_STATE", message: "Invalid OAuth state" } };
		}

		try {
			const tokens = await google.validateAuthorizationCode(code, codeVerifier);
			const accessToken = tokens.accessToken();

			// Fetch user info from Google
			const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
				headers: { Authorization: `Bearer ${accessToken}` },
			});
			const googleUser = (await res.json()) as {
				sub: string;
				email: string;
				name?: string;
				picture?: string;
			};

			// Check for existing OAuth link
			const existingOAuth = await sql`
				SELECT user_id FROM oauth_accounts
				WHERE provider = 'google' AND provider_user_id = ${googleUser.sub}
			`;

			let userId: string;

			if (existingOAuth.length > 0) {
				userId = existingOAuth[0].user_id;
			} else {
				// Check if user exists with this email
				const existingUser =
					await sql`SELECT id FROM users WHERE email = ${googleUser.email.toLowerCase()}`;

				if (existingUser.length > 0) {
					userId = existingUser[0].id;
				} else {
					// Create new user
					const username =
						googleUser.email
							.split("@")[0]
							.replace(/[^a-zA-Z0-9_-]/g, "")
							.toLowerCase()
							.slice(0, 30) || `user_${Date.now()}`;

					const rows = await sql`
						INSERT INTO users (email, username, display_name, email_verified, role, account_status, avatar_url)
						VALUES (
							${googleUser.email.toLowerCase()},
							${username},
							${googleUser.name || null},
							TRUE,
							'user',
							'active',
							${googleUser.picture || null}
						)
						RETURNING id
					`;
					userId = rows[0].id;
				}

				// Link OAuth account
				await sql`
					INSERT INTO oauth_accounts (user_id, provider, provider_user_id)
					VALUES (${userId}, 'google', ${googleUser.sub})
					ON CONFLICT (provider, provider_user_id) DO NOTHING
				`;
			}

			const session = await lucia.createSession(userId, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			cookie[lucia.sessionCookieName]?.set({
				value: sessionCookie.value,
				...sessionCookie.attributes,
			});

			set.redirect = `${env.BASE_URL}/app/dashboard`;
		} catch (e) {
			console.error("[auth] google callback error:", e);
			set.status = 500;
			return {
				ok: false,
				error: { code: "OAUTH_ERROR", message: "Failed to authenticate with Google" },
			};
		}
	})

	// ─── Apple OAuth: Redirect ───────────────────────────────────────
	.get("/apple", async ({ cookie, set }) => {
		if (!apple) {
			set.status = 501;
			return {
				ok: false,
				error: { code: "NOT_CONFIGURED", message: "Apple OAuth is not configured" },
			};
		}

		const state = arctic.generateState();

		cookie.apple_oauth_state?.set({
			value: state,
			path: "/",
			httpOnly: true,
			secure: env.NODE_ENV === "production",
			sameSite: "none", // Apple uses form_post
			maxAge: 60 * 10,
		});

		const url = apple.createAuthorizationURL(state, ["name", "email"]);
		url.searchParams.set("response_mode", "form_post");
		set.redirect = url.toString();
	})

	// ─── Apple OAuth: Callback ───────────────────────────────────────
	.post("/callback/apple", async ({ body, cookie, set }) => {
		if (!apple) {
			set.status = 501;
			return {
				ok: false,
				error: { code: "NOT_CONFIGURED", message: "Apple OAuth is not configured" },
			};
		}

		const formBody = body as Record<string, string>;
		const code = formBody.code;
		const state = formBody.state;
		const storedState = cookie.apple_oauth_state?.value;

		if (!code || !state || !storedState || state !== storedState) {
			set.status = 400;
			return { ok: false, error: { code: "INVALID_STATE", message: "Invalid OAuth state" } };
		}

		try {
			const tokens = await apple.validateAuthorizationCode(code);
			const idToken = tokens.idToken();
			const claims = arctic.decodeIdToken(idToken) as {
				payload: { sub: string; email?: string };
			};
			const appleUserId = claims.payload.sub;
			const email = claims.payload.email;

			// Parse user data from Apple (only sent on first auth)
			let name: string | null = null;
			if (formBody.user) {
				try {
					const userData = JSON.parse(formBody.user);
					name =
						[userData.name?.firstName, userData.name?.lastName].filter(Boolean).join(" ") || null;
				} catch {
					// ignore parse errors
				}
			}

			// Check for existing OAuth link
			const existingOAuth = await sql`
				SELECT user_id FROM oauth_accounts
				WHERE provider = 'apple' AND provider_user_id = ${appleUserId}
			`;

			let userId: string;

			if (existingOAuth.length > 0) {
				userId = existingOAuth[0].user_id;
			} else {
				if (email) {
					const existingUser = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;

					if (existingUser.length > 0) {
						userId = existingUser[0].id;
					} else {
						const username =
							email
								.split("@")[0]
								.replace(/[^a-zA-Z0-9_-]/g, "")
								.toLowerCase()
								.slice(0, 30) || `user_${Date.now()}`;

						const rows = await sql`
							INSERT INTO users (email, username, display_name, email_verified, role, account_status)
							VALUES (
								${email.toLowerCase()},
								${username},
								${name},
								TRUE,
								'user',
								'active'
							)
							RETURNING id
						`;
						userId = rows[0].id;
					}
				} else {
					set.status = 400;
					return {
						ok: false,
						error: {
							code: "MISSING_EMAIL",
							message: "Email is required from Apple",
						},
					};
				}

				await sql`
					INSERT INTO oauth_accounts (user_id, provider, provider_user_id)
					VALUES (${userId}, 'apple', ${appleUserId})
					ON CONFLICT (provider, provider_user_id) DO NOTHING
				`;
			}

			const session = await lucia.createSession(userId, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			cookie[lucia.sessionCookieName]?.set({
				value: sessionCookie.value,
				...sessionCookie.attributes,
			});

			set.redirect = `${env.BASE_URL}/app/dashboard`;
		} catch (e) {
			console.error("[auth] apple callback error:", e);
			set.status = 500;
			return {
				ok: false,
				error: { code: "OAUTH_ERROR", message: "Failed to authenticate with Apple" },
			};
		}
	});
