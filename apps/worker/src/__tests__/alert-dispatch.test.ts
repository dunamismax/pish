import { afterAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { processAlertDispatch } from "../jobs/alert-dispatch";

const databaseUrl = process.env.DATABASE_URL ?? "postgres://pish:pish@localhost:5432/pish";
const sql = postgres(databaseUrl);

const BASE_LAT = 26.142;
const BASE_LNG = -81.794;

async function createUser(role = "user") {
	const id = randomUUID();
	await sql`
		INSERT INTO users (id, email, username, role, account_status, email_verified)
		VALUES (
			${id},
			${`alerts-${id}@example.com`},
			${`alerts_${id.slice(0, 8)}`},
			${role},
			'active',
			TRUE
		)
	`;
	return id;
}

async function createSpecies() {
	const speciesId = randomUUID();
	await sql`
		INSERT INTO species (id, species_code, common_name, scientific_name, category)
		VALUES (
			${speciesId},
			${`alerts-${speciesId.slice(0, 8)}`},
			'Roseate Spoonbill',
			'Platalea ajaja',
			'species'
		)
	`;
	return speciesId;
}

async function cleanup(userIds: string[], speciesId: string) {
	await sql`DELETE FROM notifications WHERE user_id = ANY(${userIds})`;
	await sql`DELETE FROM user_species_alerts WHERE user_id = ANY(${userIds})`;
	await sql`DELETE FROM user_location_alerts WHERE user_id = ANY(${userIds})`;
	await sql`DELETE FROM users WHERE id = ANY(${userIds})`;
	await sql`DELETE FROM species WHERE id = ${speciesId}`;
}

describe("alert dispatch integration", () => {
	test("fans out notifications across species and location alerts without duplicates", async () => {
		const speciesId = await createSpecies();
		const reporterId = await createUser();
		const speciesUserId = await createUser();
		const locationUserId = await createUser();
		const dualAlertUserId = await createUser();
		const megaRareOnlyUserId = await createUser();
		const farAwayUserId = await createUser();
		const userIds = [
			reporterId,
			speciesUserId,
			locationUserId,
			dualAlertUserId,
			megaRareOnlyUserId,
			farAwayUserId,
		];

		try {
			await sql`
				INSERT INTO user_species_alerts (user_id, species_id, min_rarity, radius_km)
				VALUES
					(${speciesUserId}, ${speciesId}, 'rare', 50),
					(${dualAlertUserId}, ${speciesId}, 'uncommon', 50),
					(${megaRareOnlyUserId}, ${speciesId}, 'mega_rare', 50)
			`;

			await sql`
				INSERT INTO user_location_alerts (user_id, location, radius_km)
				VALUES
					(
						${locationUserId},
						ST_SetSRID(ST_MakePoint(${BASE_LNG + 0.01}, ${BASE_LAT + 0.01}), 4326)::geography,
						10
					),
					(
						${dualAlertUserId},
						ST_SetSRID(ST_MakePoint(${BASE_LNG}, ${BASE_LAT}), 4326)::geography,
						10
					),
					(
						${farAwayUserId},
						ST_SetSRID(ST_MakePoint(${BASE_LNG + 4}, ${BASE_LAT + 4}), 4326)::geography,
						5
					)
			`;

			await processAlertDispatch({
				data: {
					id: randomUUID(),
					userId: reporterId,
					speciesId,
					lat: BASE_LAT,
					lng: BASE_LNG,
					locationName: "Corkscrew Swamp",
					rarity: "rare",
					status: "confirmed",
				},
			} as never);

			const rows = await sql`
				SELECT user_id, type, title, body
				FROM notifications
				WHERE user_id = ANY(${userIds})
				ORDER BY user_id, type
			`;

			const byUser = new Map<string, { type: string; title: string; body: string }[]>();
			for (const row of rows) {
				const current = byUser.get(row.user_id) ?? [];
				current.push({ type: row.type, title: row.title, body: row.body });
				byUser.set(row.user_id, current);
			}

			expect(byUser.get(speciesUserId)).toEqual([
				expect.objectContaining({ type: "species_alert", title: "Roseate Spoonbill spotted!" }),
			]);
			expect(byUser.get(locationUserId)).toEqual([
				expect.objectContaining({ type: "location_alert", title: "New sighting nearby!" }),
			]);
			expect(byUser.get(dualAlertUserId)).toEqual([
				expect.objectContaining({ type: "species_alert" }),
			]);
			expect(byUser.has(megaRareOnlyUserId)).toBe(false);
			expect(byUser.has(farAwayUserId)).toBe(false);
			expect(byUser.has(reporterId)).toBe(false);
		} finally {
			await cleanup(userIds, speciesId);
		}
	});
});

afterAll(async () => {
	await sql.end({ timeout: 1 });
});
