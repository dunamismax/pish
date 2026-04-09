import { Elysia, t } from "elysia";
import { evaluateConfirmation, getInitialStatus } from "../lib/confirmation";
import { sql } from "../lib/db";
import { classifyRarity } from "../lib/rarity";
import { valkey } from "../lib/valkey";
import { sessionMiddleware } from "../middleware/auth";

function mapSighting(r: Record<string, unknown>) {
	return {
		id: r.id,
		userId: r.user_id,
		speciesId: r.species_id,
		lat: Number(r.lat),
		lng: Number(r.lng),
		locationName: r.location_name ?? null,
		notes: r.notes ?? null,
		rarity: r.rarity,
		status: r.status,
		confirmationCount: Number(r.confirmation_count),
		photoUrls: r.photo_urls ?? [],
		audioUrl: r.audio_url ?? null,
		createdAt: (r.created_at as Date).toISOString(),
		updatedAt: (r.updated_at as Date).toISOString(),
	};
}

export const sightingRoutes = new Elysia({ prefix: "/api/sightings" })
	.use(sessionMiddleware)

	// ─── Nearby Sightings (with species info) ───────────────────
	.get(
		"/nearby",
		async ({ query }) => {
			const { lat, lng, radiusKm, limit, status: statusFilter } = query;
			const radiusMeters = (radiusKm ?? 25) * 1000;
			const lim = limit ?? 20;

			const conditions = [
				`ST_DWithin(sg.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)`,
			];
			const params: unknown[] = [lng, lat, radiusMeters];

			if (statusFilter) {
				conditions.push(`sg.status = $${params.length + 1}`);
				params.push(statusFilter);
			}

			const whereClause = conditions.join(" AND ");

			const rows = await sql.unsafe(
				`SELECT
					sg.id, sg.user_id, sg.species_id, sg.lat, sg.lng,
					sg.location_name, sg.notes, sg.rarity, sg.status,
					sg.confirmation_count, sg.photo_urls, sg.audio_url,
					sg.created_at, sg.updated_at,
					sp.common_name, sp.scientific_name, sp.species_code,
					u.username AS observer_username,
					ST_Distance(
						sg.location,
						ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
					) AS distance_meters
				FROM sightings sg
				JOIN species sp ON sp.id = sg.species_id
				LEFT JOIN users u ON u.id = sg.user_id
				WHERE ${whereClause}
				ORDER BY sg.created_at DESC
				LIMIT $${params.length + 1}`,
				[...params, lim] as never[],
			);

			return {
				ok: true,
				data: rows.map((r) => ({
					...mapSighting(r),
					species: {
						commonName: r.common_name,
						scientificName: r.scientific_name,
						speciesCode: r.species_code,
					},
					observerUsername: r.observer_username ?? null,
					distanceKm: Math.round((Number(r.distance_meters) / 1000) * 10) / 10,
				})),
			};
		},
		{
			query: t.Object({
				lat: t.Numeric({ minimum: -90, maximum: 90 }),
				lng: t.Numeric({ minimum: -180, maximum: 180 }),
				radiusKm: t.Optional(t.Numeric({ minimum: 0.1, maximum: 500, default: 25 })),
				limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
				status: t.Optional(t.Union([t.Literal("unconfirmed"), t.Literal("confirmed")])),
			}),
		},
	)

	// ─── Create Sighting ─────────────────────────────────────────
	.post(
		"/",
		async ({ body, user, set }) => {
			if (!user) {
				set.status = 401;
				return { ok: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } };
			}

			const rarity = await classifyRarity(body.speciesId, body.regionCode);
			const initialStatus = await getInitialStatus(rarity, user.role, user.id);

			const rows = await sql`
				INSERT INTO sightings (user_id, species_id, location, lat, lng, location_name, notes, rarity, status, photo_urls, audio_url)
				VALUES (
					${user.id},
					${body.speciesId},
					ST_SetSRID(ST_MakePoint(${body.lng}, ${body.lat}), 4326)::geography,
					${body.lat},
					${body.lng},
					${body.locationName ?? null},
					${body.notes ?? null},
					${rarity},
					${initialStatus},
					${JSON.stringify(body.photoUrls ?? [])},
					${body.audioUrl ?? null}
				)
				RETURNING *
			`;

			const sighting = mapSighting(rows[0]);

			// If auto-confirmed (common rarity), publish immediately
			if (initialStatus === "confirmed") {
				await valkey.publish("sighting:confirmed", JSON.stringify(sighting));
			}

			// Queue image processing if photos provided
			if (body.photoUrls && body.photoUrls.length > 0) {
				await valkey.publish(
					"job:process-sighting-images",
					JSON.stringify({ sightingId: sighting.id, photoUrls: body.photoUrls }),
				);
			}

			set.status = 201;
			return { ok: true, data: sighting };
		},
		{
			body: t.Object({
				speciesId: t.String({ format: "uuid" }),
				lat: t.Number({ minimum: -90, maximum: 90 }),
				lng: t.Number({ minimum: -180, maximum: 180 }),
				locationName: t.Optional(t.String({ maxLength: 200 })),
				notes: t.Optional(t.String({ maxLength: 2000 })),
				photoUrls: t.Optional(t.Array(t.String(), { maxItems: 10 })),
				audioUrl: t.Optional(t.String()),
				regionCode: t.Optional(t.String()),
			}),
		},
	)

	// ─── List / Search Sightings ─────────────────────────────────
	.get(
		"/",
		async ({ query }) => {
			const { lat, lng, radiusKm, speciesId, status, rarity, page, limit } = query;
			const offset = ((page || 1) - 1) * (limit || 20);
			const lim = limit || 20;

			const conditions: string[] = [];
			const params: unknown[] = [];

			if (lat !== undefined && lng !== undefined && radiusKm) {
				conditions.push(
					`ST_DWithin(location, ST_SetSRID(ST_MakePoint($${params.length + 1}, $${params.length + 2}), 4326)::geography, $${params.length + 3})`,
				);
				params.push(lng, lat, radiusKm * 1000);
			}
			if (speciesId) {
				conditions.push(`species_id = $${params.length + 1}`);
				params.push(speciesId);
			}
			if (status) {
				conditions.push(`status = $${params.length + 1}`);
				params.push(status);
			}
			if (rarity) {
				conditions.push(`rarity = $${params.length + 1}`);
				params.push(rarity);
			}

			const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

			const countRows = await sql.unsafe(
				`SELECT COUNT(*)::int AS total FROM sightings ${whereClause}`,
				params as never[],
			);
			const total = countRows[0].total;

			const rows = await sql.unsafe(
				`SELECT * FROM sightings ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
				[...params, lim, offset] as never[],
			);

			return {
				ok: true,
				data: rows.map(mapSighting),
				meta: {
					page: page || 1,
					limit: lim,
					total,
					totalPages: Math.ceil(total / lim),
				},
			};
		},
		{
			query: t.Object({
				lat: t.Optional(t.Numeric({ minimum: -90, maximum: 90 })),
				lng: t.Optional(t.Numeric({ minimum: -180, maximum: 180 })),
				radiusKm: t.Optional(t.Numeric({ minimum: 0.1, maximum: 500, default: 25 })),
				speciesId: t.Optional(t.String({ format: "uuid" })),
				status: t.Optional(
					t.Union([
						t.Literal("unconfirmed"),
						t.Literal("confirmed"),
						t.Literal("flagged"),
						t.Literal("removed"),
					]),
				),
				rarity: t.Optional(
					t.Union([
						t.Literal("common"),
						t.Literal("uncommon"),
						t.Literal("rare"),
						t.Literal("mega_rare"),
					]),
				),
				page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
				limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
			}),
		},
	)

	// ─── Get Sighting by ID ──────────────────────────────────────
	.get(
		"/:id",
		async ({ params, set }) => {
			const rows = await sql`
				SELECT * FROM sightings WHERE id = ${params.id}
			`;

			if (rows.length === 0) {
				set.status = 404;
				return { ok: false, error: { code: "NOT_FOUND", message: "Sighting not found" } };
			}

			// Also fetch confirmations
			const confirmations = await sql`
				SELECT id, sighting_id, user_id, photo_url, notes, created_at
				FROM sighting_confirmations
				WHERE sighting_id = ${params.id}
				ORDER BY created_at ASC
			`;

			return {
				ok: true,
				data: {
					...mapSighting(rows[0]),
					confirmations: confirmations.map((c) => ({
						id: c.id,
						sightingId: c.sighting_id,
						userId: c.user_id,
						photoUrl: c.photo_url,
						notes: c.notes,
						createdAt: (c.created_at as Date).toISOString(),
					})),
				},
			};
		},
		{
			params: t.Object({
				id: t.String({ format: "uuid" }),
			}),
		},
	)

	// ─── Confirm Sighting ────────────────────────────────────────
	.post(
		"/:id/confirm",
		async ({ params, body, user, set }) => {
			if (!user) {
				set.status = 401;
				return { ok: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } };
			}

			// Get the sighting
			const sightingRows = await sql`
				SELECT * FROM sightings WHERE id = ${params.id}
			`;
			if (sightingRows.length === 0) {
				set.status = 404;
				return { ok: false, error: { code: "NOT_FOUND", message: "Sighting not found" } };
			}

			const sighting = sightingRows[0];

			// Can't confirm your own sighting
			if (sighting.user_id === user.id) {
				set.status = 400;
				return {
					ok: false,
					error: { code: "SELF_CONFIRM", message: "Cannot confirm your own sighting" },
				};
			}

			// Can't confirm already removed sightings
			if (sighting.status === "removed") {
				set.status = 400;
				return {
					ok: false,
					error: { code: "REMOVED", message: "Sighting has been removed" },
				};
			}

			// Insert confirmation (unique constraint handles duplicates)
			try {
				await sql`
					INSERT INTO sighting_confirmations (sighting_id, user_id, photo_url, notes)
					VALUES (${params.id}, ${user.id}, ${body?.photoUrl ?? null}, ${body?.notes ?? null})
				`;
			} catch (e: unknown) {
				if ((e as { code?: string }).code === "23505") {
					set.status = 409;
					return {
						ok: false,
						error: { code: "ALREADY_CONFIRMED", message: "You already confirmed this sighting" },
					};
				}
				throw e;
			}

			// Update confirmation count
			const updatedRows = await sql`
				UPDATE sightings
				SET confirmation_count = confirmation_count + 1
				WHERE id = ${params.id}
				RETURNING *
			`;
			const updated = updatedRows[0];

			// Get reporter info for threshold evaluation
			const reporterRows = await sql`
				SELECT role FROM users WHERE id = ${sighting.user_id}
			`;
			const reporterRole = reporterRows[0]?.role ?? "user";

			// Evaluate if sighting should be confirmed
			const newStatus = await evaluateConfirmation({
				sightingId: params.id,
				reporterUserId: sighting.user_id as string,
				reporterRole,
				rarity: updated.rarity as "common" | "uncommon" | "rare" | "mega_rare",
				currentConfirmationCount: Number(updated.confirmation_count),
				confirmingUserRole: user.role,
			});

			if (newStatus === "confirmed" && sighting.status !== "confirmed") {
				await sql`
					UPDATE sightings SET status = 'confirmed' WHERE id = ${params.id}
				`;

				// Publish confirmed sighting for alert dispatch
				const confirmed = { ...mapSighting(updated), status: "confirmed" };
				await valkey.publish("sighting:confirmed", JSON.stringify(confirmed));
			}

			return { ok: true, data: { confirmationCount: Number(updated.confirmation_count) } };
		},
		{
			params: t.Object({
				id: t.String({ format: "uuid" }),
			}),
			body: t.Optional(
				t.Object({
					photoUrl: t.Optional(t.String()),
					notes: t.Optional(t.String({ maxLength: 1000 })),
				}),
			),
		},
	)

	// ─── Flag Sighting ───────────────────────────────────────────
	.post(
		"/:id/flag",
		async ({ params, body, user, set }) => {
			if (!user) {
				set.status = 401;
				return { ok: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } };
			}

			// Get sighting
			const sightingRows = await sql`
				SELECT id, user_id, status FROM sightings WHERE id = ${params.id}
			`;
			if (sightingRows.length === 0) {
				set.status = 404;
				return { ok: false, error: { code: "NOT_FOUND", message: "Sighting not found" } };
			}

			// Insert flag
			await sql`
				INSERT INTO sighting_flags (sighting_id, user_id, reason)
				VALUES (${params.id}, ${user.id}, ${body.reason})
			`;

			// Count unresolved flags for this sighting
			const flagCountRows = await sql`
				SELECT COUNT(*)::int AS cnt
				FROM sighting_flags
				WHERE sighting_id = ${params.id} AND NOT resolved
			`;
			const flagCount = flagCountRows[0].cnt;

			// Count total unresolved flags for the reporter
			const reporterUserId = sightingRows[0].user_id;
			const reporterFlagRows = await sql`
				SELECT COUNT(*)::int AS cnt
				FROM sighting_flags sf
				JOIN sightings s ON s.id = sf.sighting_id
				WHERE s.user_id = ${reporterUserId} AND NOT sf.resolved
			`;
			const reporterFlagCount = reporterFlagRows[0].cnt;

			// Anti-abuse: auto-flag sighting at 3+, remove at 5+
			if (flagCount >= 5 || reporterFlagCount >= 10) {
				await sql`
					UPDATE sightings SET status = 'removed' WHERE id = ${params.id}
				`;
			} else if (flagCount >= 3 || reporterFlagCount >= 5) {
				await sql`
					UPDATE sightings SET status = 'flagged' WHERE id = ${params.id}
				`;
			}

			return { ok: true, data: { flagged: true } };
		},
		{
			params: t.Object({
				id: t.String({ format: "uuid" }),
			}),
			body: t.Object({
				reason: t.String({ minLength: 5, maxLength: 1000 }),
			}),
		},
	);
