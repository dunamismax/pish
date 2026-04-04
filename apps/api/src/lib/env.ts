import { z } from "zod";

const EnvSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	API_PORT: z.coerce.number().default(3001),
	DATABASE_URL: z.string().default("postgres://pish:pish@localhost:5432/pish"),
	VALKEY_URL: z.string().default("redis://localhost:6379"),
	MEILISEARCH_URL: z.string().default("http://localhost:7700"),
	MEILISEARCH_KEY: z.string().default("pish-dev-key"),

	// Auth
	BASE_URL: z.string().default("http://localhost:3000"),

	// OAuth - Google
	GOOGLE_CLIENT_ID: z.string().default(""),
	GOOGLE_CLIENT_SECRET: z.string().default(""),

	// OAuth - Apple (requires team ID, key ID, and PKCS8 private key)
	APPLE_CLIENT_ID: z.string().default(""),
	APPLE_TEAM_ID: z.string().default(""),
	APPLE_KEY_ID: z.string().default(""),
	APPLE_PRIVATE_KEY: z.string().default(""),

	// Email
	RESEND_API_KEY: z.string().default(""),
	EMAIL_FROM: z.string().default("noreply@getpish.com"),

	// Sentry
	SENTRY_DSN: z.string().default(""),
});

export const env = EnvSchema.parse(process.env);
