import { renderPasswordResetEmail, renderVerificationEmail } from "@pish/email";
import { Resend } from "resend";
import { env } from "./env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendVerificationEmail(
	to: string,
	username: string,
	token: string,
): Promise<void> {
	const verificationUrl = `${env.BASE_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
	const email = renderVerificationEmail({ username, verificationUrl });

	if (!resend) {
		console.log(`[email] verification email for ${to}: ${verificationUrl}`);
		return;
	}

	await resend.emails.send({
		from: env.EMAIL_FROM,
		to,
		subject: email.subject,
		html: email.html,
		text: email.text,
	});
}

export async function sendPasswordResetEmail(
	to: string,
	username: string,
	token: string,
): Promise<void> {
	const resetUrl = `${env.BASE_URL}/reset-password?token=${encodeURIComponent(token)}`;
	const email = renderPasswordResetEmail({ username, resetUrl });

	if (!resend) {
		console.log(`[email] password reset email for ${to}: ${resetUrl}`);
		return;
	}

	await resend.emails.send({
		from: env.EMAIL_FROM,
		to,
		subject: email.subject,
		html: email.html,
		text: email.text,
	});
}
