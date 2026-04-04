import { z } from "zod";

export const SignUpSchema = z.object({
	email: z.string().email(),
	username: z
		.string()
		.min(3)
		.max(30)
		.regex(
			/^[a-zA-Z0-9_-]+$/,
			"Username may only contain letters, numbers, hyphens, and underscores",
		),
	password: z.string().min(8).max(128),
});

export const SignInSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
});

export const ForgotPasswordSchema = z.object({
	email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
	token: z.string().min(1),
	password: z.string().min(8).max(128),
});

export const VerifyEmailSchema = z.object({
	token: z.string().min(1),
});

export const OAuthProviderSchema = z.enum(["google", "apple"]);

export const SessionSchema = z.object({
	id: z.string(),
	userId: z.string().uuid(),
	expiresAt: z.string().datetime(),
});

export const AuthResponseSchema = z.object({
	ok: z.literal(true),
	data: z.object({
		userId: z.string().uuid(),
		message: z.string().optional(),
	}),
});

export const CurrentUserSchema = z.object({
	id: z.string().uuid(),
	email: z.string().email(),
	username: z.string(),
	displayName: z.string().nullable(),
	role: z.string(),
	accountStatus: z.string(),
	emailVerified: z.boolean(),
	avatarUrl: z.string().url().nullable(),
});

export type SignUp = z.infer<typeof SignUpSchema>;
export type SignIn = z.infer<typeof SignInSchema>;
export type ForgotPassword = z.infer<typeof ForgotPasswordSchema>;
export type ResetPassword = z.infer<typeof ResetPasswordSchema>;
export type VerifyEmail = z.infer<typeof VerifyEmailSchema>;
export type OAuthProvider = z.infer<typeof OAuthProviderSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type CurrentUser = z.infer<typeof CurrentUserSchema>;
