/**
 * Create a new empty SQL migration file.
 *
 * Usage: bun run db/create-migration.ts <name>
 * Example: bun run db/create-migration.ts create-users
 */

import { join } from "node:path";

const name = process.argv[2];
if (!name) {
	console.error("Usage: bun run db/create-migration.ts <name>");
	process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);

const filename = `${timestamp}_${name}.sql`;
const filepath = join(import.meta.dirname, "migrations", filename);

await Bun.write(filepath, `-- Migration: ${name}\n-- Created: ${new Date().toISOString()}\n\n`);

console.log(`[create-migration] created ${filename}`);
