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

export type SignUp = z.infer<typeof SignUpSchema>;
export type SignIn = z.infer<typeof SignInSchema>;
export type ForgotPassword = z.infer<typeof ForgotPasswordSchema>;
export type ResetPassword = z.infer<typeof ResetPasswordSchema>;
export type VerifyEmail = z.infer<typeof VerifyEmailSchema>;
