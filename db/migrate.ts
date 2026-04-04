/**
 * SQL migration runner for Pish.
 *
 * Reads .sql files from db/migrations/ in lexicographic order,
 * tracks applied migrations in a `_migrations` table, and applies
 * any that haven't been run yet.
 *
 * Usage: bun run db/migrate.ts
 */

import { readdir } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL || "postgres://pish:pish@localhost:5432/pish";
const sql = postgres(databaseUrl);

const MIGRATIONS_DIR = join(import.meta.dirname, "migrations");

async function ensureMigrationsTable() {
	await sql`
		CREATE TABLE IF NOT EXISTS _migrations (
			id SERIAL PRIMARY KEY,
			name TEXT NOT NULL UNIQUE,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`;
}

async function getAppliedMigrations(): Promise<Set<string>> {
	const rows = await sql<{ name: string }[]>`SELECT name FROM _migrations ORDER BY name`;
	return new Set(rows.map((r) => r.name));
}

async function run() {
	console.log("[migrate] starting...");
	await ensureMigrationsTable();

	const applied = await getAppliedMigrations();
	const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();

	let count = 0;
	for (const file of files) {
		if (applied.has(file)) {
			continue;
		}
		const content = await Bun.file(join(MIGRATIONS_DIR, file)).text();
		console.log(`[migrate] applying ${file}...`);
		await sql.begin(async (tx) => {
			await tx.unsafe(content);
			await tx`INSERT INTO _migrations (name) VALUES (${file})`;
		});
		count++;
	}

	if (count === 0) {
		console.log("[migrate] no new migrations to apply.");
	} else {
		console.log(`[migrate] applied ${count} migration(s).`);
	}

	await sql.end();
}

run().catch((err) => {
	console.error("[migrate] failed:", err);
	process.exit(1);
});
