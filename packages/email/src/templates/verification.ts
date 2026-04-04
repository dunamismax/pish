interface VerificationEmailProps {
	username: string;
	verificationUrl: string;
}

export function renderVerificationEmail(props: VerificationEmailProps): {
	html: string;
	text: string;
	subject: string;
} {
	const { username, verificationUrl } = props;

	return {
		subject: "Verify your Pish account",
		html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; max-width: 560px; margin: 0 auto;">
  <h1 style="font-size: 24px; color: #1a1a1a;">Welcome to Pish, ${username}!</h1>
  <p style="color: #4a4a4a; line-height: 1.6;">Verify your email address to get started.</p>
  <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Verify Email</a>
  <p style="color: #888; font-size: 14px; margin-top: 24px;">If you didn't create this account, you can safely ignore this email.</p>
</body>
</html>`,
		text: `Welcome to Pish, ${username}!\n\nVerify your email: ${verificationUrl}\n\nIf you didn't create this account, ignore this email.`,
	};
}
