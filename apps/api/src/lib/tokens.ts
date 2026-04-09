import { sql } from "./db";

/**
 * Generate a cryptographically random token and return both the raw token
 * (sent to the user) and the SHA-256 hash (stored in the database).
 */
export async function generateToken(): Promise<{ raw: string; hash: string }> {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	const raw = Buffer.from(bytes).toString("base64url");
	const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
	const hash = Buffer.from(hashBuffer).toString("hex");
	return { raw, hash };
}

/**
 * Hash a raw token for database lookup.
 */
export async function hashToken(raw: string): Promise<string> {
	const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
	return Buffer.from(hashBuffer).toString("hex");
}

/**
 * Create an email verification token valid for 24 hours.
 */
export async function createEmailVerificationToken(userId: string): Promise<string> {
	// Delete existing tokens for this user
	await sql`DELETE FROM email_verification_tokens WHERE user_id = ${userId}`;

	const { raw, hash } = await generateToken();
	const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

	await sql`
		INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
		VALUES (${userId}, ${hash}, ${expiresAt})
	`;

	return raw;
}

/**
 * Validate an email verification token. Returns the user_id if valid, null otherwise.
 */
export async function validateEmailVerificationToken(raw: string): Promise<string | null> {
	const tokenHash = await hashToken(raw);

	const rows = await sql`
		SELECT user_id, expires_at
		FROM email_verification_tokens
		WHERE token_hash = ${tokenHash}
	`;

	if (rows.length === 0) return null;

	const token = rows[0];
	const expiresAt = new Date(token.expires_at);

	// Delete the token (single-use)
	await sql`DELETE FROM email_verification_tokens WHERE token_hash = ${tokenHash}`;

	if (expiresAt < new Date()) return null;

	return token.user_id;
}

/**
 * Create a password reset token valid for 1 hour.
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
	// Delete existing unused tokens for this user
	await sql`DELETE FROM password_reset_tokens WHERE user_id = ${userId} AND used = FALSE`;

	const { raw, hash } = await generateToken();
	const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

	await sql`
		INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
		VALUES (${userId}, ${hash}, ${expiresAt})
	`;

	return raw;
}

/**
 * Validate a password reset token. Returns the user_id if valid, null otherwise.
 * Marks the token as used.
 */
export async function validatePasswordResetToken(raw: string): Promise<string | null> {
	const tokenHash = await hashToken(raw);

	const rows = await sql`
		SELECT id, user_id, expires_at, used
		FROM password_reset_tokens
		WHERE token_hash = ${tokenHash}
	`;

	if (rows.length === 0) return null;

	const token = rows[0];
	if (token.used) return null;

	const expiresAt = new Date(token.expires_at);
	if (expiresAt < new Date()) return null;

	// Mark as used
	await sql`UPDATE password_reset_tokens SET used = TRUE WHERE id = ${token.id}`;

	return token.user_id;
}
