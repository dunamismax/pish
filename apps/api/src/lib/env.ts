import { z } from "zod";

const EnvSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	API_PORT: z.coerce.number().default(3001),
	DATABASE_URL: z.string().default("postgres://pish:pish@localhost:5432/pish"),
	VALKEY_URL: z.string().default("redis://localhost:6379"),
	MEILISEARCH_URL: z.string().default("http://localhost:7700"),
	MEILISEARCH_KEY: z.string().default("pish-dev-key"),
});

export const env = EnvSchema.parse(process.env);
