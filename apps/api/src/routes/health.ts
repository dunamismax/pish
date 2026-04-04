import { Elysia } from "elysia";

export const healthRoutes = new Elysia({ prefix: "/api" })
	.get("/health", () => ({
		ok: true,
		service: "pish-api",
		timestamp: new Date().toISOString(),
	}))
	.get("/ready", async () => {
		// TODO: check DB, Valkey, MeiliSearch connectivity
		return {
			ok: true,
			service: "pish-api",
			checks: {
				database: "skipped",
				valkey: "skipped",
				meilisearch: "skipped",
			},
			timestamp: new Date().toISOString(),
		};
	});
