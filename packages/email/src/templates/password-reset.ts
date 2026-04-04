interface PasswordResetEmailProps {
	username: string;
	resetUrl: string;
}

export function renderPasswordResetEmail(props: PasswordResetEmailProps): {
	html: string;
	text: string;
	subject: string;
} {
	const { username, resetUrl } = props;

	return {
		subject: "Reset your Pish password",
		html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; max-width: 560px; margin: 0 auto;">
  <h1 style="font-size: 24px; color: #1a1a1a;">Password Reset</h1>
  <p style="color: #4a4a4a; line-height: 1.6;">Hi ${username}, we received a request to reset your password.</p>
  <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Reset Password</a>
  <p style="color: #888; font-size: 14px; margin-top: 24px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
</body>
</html>`,
		text: `Hi ${username},\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
	};
}
