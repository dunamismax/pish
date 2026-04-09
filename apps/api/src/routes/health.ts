import { Elysia } from "elysia";
import { sql } from "../lib/db";
import { meili } from "../lib/search";
import { valkey } from "../lib/valkey";

export const healthRoutes = new Elysia({ prefix: "/api" })
	.get("/health", () => ({
		ok: true,
		service: "pish-api",
		timestamp: new Date().toISOString(),
	}))
	.get("/ready", async ({ set }) => {
		const checks: Record<string, string> = {};

		try {
			await sql`SELECT 1`;
			checks.database = "ok";
		} catch {
			checks.database = "error";
		}

		try {
			const pong = await valkey.ping();
			checks.valkey = pong === "PONG" ? "ok" : "error";
		} catch {
			checks.valkey = "error";
		}

		try {
			const health = await meili.health();
			checks.meilisearch = health.status === "available" ? "ok" : "error";
		} catch {
			checks.meilisearch = "error";
		}

		const allOk = Object.values(checks).every((v) => v === "ok");
		if (!allOk) {
			set.status = 503;
		}

		return {
			ok: allOk,
			service: "pish-api",
			checks,
			timestamp: new Date().toISOString(),
		};
	});
