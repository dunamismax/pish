import { afterAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { Elysia } from "elysia";
import { lucia } from "../lib/auth";
import { sql } from "../lib/db";
import { valkey } from "../lib/valkey";
import { sightingRoutes } from "../routes/sightings";

const app = new Elysia().use(sightingRoutes);
const month = new Date().getMonth() + 1;

type UserRole = "trusted" | "user" | "new_user";

async function createUser(role: UserRole) {
	const id = randomUUID();
	await sql`
		INSERT INTO users (id, email, username, role, account_status, email_verified)
		VALUES (
			${id},
			${`phase2-${id}@example.com`},
			${`phase2_${id.slice(0, 8)}`},
			${role},
			'active',
			TRUE
		)
	`;
	return id;
}

async function createSpecies(frequency: number) {
	const speciesId = randomUUID();
	await sql`
		INSERT INTO species (id, species_code, common_name, scientific_name, category)
		VALUES (
			${speciesId},
			${`phase2-${speciesId.slice(0, 8)}`},
			${`Phase 2 Bird ${speciesId.slice(0, 4)}`},
			${`Aves phaseii ${speciesId.slice(0, 4)}`},
			'species'
		)
	`;
	await sql`
		INSERT INTO species_frequency (species_id, region_code, month, frequency, sample_size)
		VALUES (${speciesId}, 'US', ${month}, ${frequency}, 42)
	`;
	return speciesId;
}

async function createSessionCookie(userId: string) {
	const session = await lucia.createSession(userId, {});
	const cookie = lucia.createSessionCookie(session.id);
	return `${cookie.name}=${cookie.value}`;
}

async function requestJson(
	path: string,
	options: { method?: string; cookie?: string; body?: unknown },
) {
	const response = await app.handle(
		new Request(`http://localhost${path}`, {
			method: options.method ?? "GET",
			headers: {
				...(options.body ? { "content-type": "application/json" } : {}),
				...(options.cookie ? { cookie: options.cookie } : {}),
			},
			body: options.body ? JSON.stringify(options.body) : undefined,
		}),
	);

	const text = await response.text();
	return {
		status: response.status,
		json: text ? JSON.parse(text) : null,
	};
}

async function getSightingRecord(sightingId: string) {
	const rows = await sql`
		SELECT status, rarity, confirmation_count
		FROM sightings
		WHERE id = ${sightingId}
	`;
	return rows[0] ?? null;
}

async function cleanup(userIds: string[], speciesId: string) {
	await sql`DELETE FROM sighting_confirmations WHERE sighting_id IN (SELECT id FROM sightings WHERE species_id = ${speciesId})`;
	await sql`DELETE FROM sightings WHERE species_id = ${speciesId}`;
	await sql`DELETE FROM sessions WHERE user_id = ANY(${userIds})`;
	await sql`DELETE FROM users WHERE id = ANY(${userIds})`;
	await sql`DELETE FROM species_frequency WHERE species_id = ${speciesId}`;
	await sql`DELETE FROM species WHERE id = ${speciesId}`;
}

describe("Phase 2 sighting flow integration", () => {
	test("creates a rare sighting and confirms it after two standard confirmations", async () => {
		const speciesId = await createSpecies(0.05);
		const reporterId = await createUser("user");
		const confirmerOneId = await createUser("user");
		const confirmerTwoId = await createUser("user");
		const userIds = [reporterId, confirmerOneId, confirmerTwoId];

		try {
			const reporterCookie = await createSessionCookie(reporterId);
			const confirmerOneCookie = await createSessionCookie(confirmerOneId);
			const confirmerTwoCookie = await createSessionCookie(confirmerTwoId);

			const createResponse = await requestJson("/api/sightings", {
				method: "POST",
				cookie: reporterCookie,
				body: {
					speciesId,
					lat: 26.142,
					lng: -81.794,
					locationName: "Corkscrew Swamp",
					regionCode: "US",
				},
			});

			expect(createResponse.status).toBe(201);
			expect(createResponse.json.data.rarity).toBe("rare");
			expect(createResponse.json.data.status).toBe("unconfirmed");
			const sightingId = createResponse.json.data.id as string;

			const firstConfirmation = await requestJson(`/api/sightings/${sightingId}/confirm`, {
				method: "POST",
				cookie: confirmerOneCookie,
			});
			expect(firstConfirmation.status).toBe(200);
			expect(firstConfirmation.json.data.confirmationCount).toBe(1);
			expect(await getSightingRecord(sightingId)).toMatchObject({
				rarity: "rare",
				status: "unconfirmed",
				confirmation_count: 1,
			});

			const secondConfirmation = await requestJson(`/api/sightings/${sightingId}/confirm`, {
				method: "POST",
				cookie: confirmerTwoCookie,
			});
			expect(secondConfirmation.status).toBe(200);
			expect(secondConfirmation.json.data.confirmationCount).toBe(2);
			expect(await getSightingRecord(sightingId)).toMatchObject({
				status: "confirmed",
				confirmation_count: 2,
			});
		} finally {
			await cleanup(userIds, speciesId);
		}
	});

	test("requires three confirmations for rare sightings reported by new users", async () => {
		const speciesId = await createSpecies(0.03);
		const reporterId = await createUser("new_user");
		const confirmerIds = [
			await createUser("user"),
			await createUser("user"),
			await createUser("user"),
		];
		const userIds = [reporterId, ...confirmerIds];

		try {
			const reporterCookie = await createSessionCookie(reporterId);
			const confirmerCookies = await Promise.all(confirmerIds.map((id) => createSessionCookie(id)));

			const createResponse = await requestJson("/api/sightings", {
				method: "POST",
				cookie: reporterCookie,
				body: {
					speciesId,
					lat: 26.23,
					lng: -81.61,
					locationName: "Ten Thousand Islands",
					regionCode: "US",
				},
			});

			expect(createResponse.status).toBe(201);
			const sightingId = createResponse.json.data.id as string;

			for (const cookie of confirmerCookies.slice(0, 2)) {
				const confirmation = await requestJson(`/api/sightings/${sightingId}/confirm`, {
					method: "POST",
					cookie,
				});
				expect(confirmation.status).toBe(200);
			}

			expect(await getSightingRecord(sightingId)).toMatchObject({
				status: "unconfirmed",
				confirmation_count: 2,
			});

			const thirdConfirmation = await requestJson(`/api/sightings/${sightingId}/confirm`, {
				method: "POST",
				cookie: confirmerCookies[2],
			});
			expect(thirdConfirmation.status).toBe(200);
			expect(await getSightingRecord(sightingId)).toMatchObject({
				status: "confirmed",
				confirmation_count: 3,
			});
		} finally {
			await cleanup(userIds, speciesId);
		}
	});

	test("confirms a rare sighting from a trusted reporter after one additional confirmation", async () => {
		const speciesId = await createSpecies(0.02);
		const reporterId = await createUser("trusted");
		const confirmerId = await createUser("user");
		const userIds = [reporterId, confirmerId];

		try {
			const reporterCookie = await createSessionCookie(reporterId);
			const confirmerCookie = await createSessionCookie(confirmerId);

			const createResponse = await requestJson("/api/sightings", {
				method: "POST",
				cookie: reporterCookie,
				body: {
					speciesId,
					lat: 26.11,
					lng: -81.77,
					locationName: "Briggs Boardwalk",
					regionCode: "US",
				},
			});

			expect(createResponse.status).toBe(201);
			expect(createResponse.json.data.rarity).toBe("rare");
			const sightingId = createResponse.json.data.id as string;

			const confirmation = await requestJson(`/api/sightings/${sightingId}/confirm`, {
				method: "POST",
				cookie: confirmerCookie,
			});
			expect(confirmation.status).toBe(200);
			expect(confirmation.json.data.confirmationCount).toBe(1);
			expect(await getSightingRecord(sightingId)).toMatchObject({
				status: "confirmed",
				confirmation_count: 1,
			});
		} finally {
			await cleanup(userIds, speciesId);
		}
	});
});

afterAll(async () => {
	await Promise.all([sql.end({ timeout: 1 }), valkey.quit()]);
});
