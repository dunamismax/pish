import { Elysia, t } from "elysia";
import { sql } from "../lib/db";
import { sessionMiddleware } from "../middleware/auth";

export const alertRoutes = new Elysia({ prefix: "/api/alerts" })
	.use(sessionMiddleware)

	// ─── Species Alerts ──────────────────────────────────────────

	.get("/species", async ({ user, set }) => {
		if (!user) {
			set.status = 401;
			return { ok: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } };
		}

		const rows = await sql`
			SELECT usa.id, usa.user_id, usa.species_id, usa.min_rarity, usa.radius_km, usa.active, usa.created_at,
			       s.common_name, s.scientific_name, s.species_code
			FROM user_species_alerts usa
			JOIN species s ON s.id = usa.species_id
			WHERE usa.user_id = ${user.id}
			ORDER BY usa.created_at DESC
		`;

		return {
			ok: true,
			data: rows.map((r) => ({
				id: r.id,
				userId: r.user_id,
				speciesId: r.species_id,
				minRarity: r.min_rarity,
				radiusKm: Number(r.radius_km),
				active: r.active,
				createdAt: (r.created_at as Date).toISOString(),
				species: {
					commonName: r.common_name,
					scientificName: r.scientific_name,
					speciesCode: r.species_code,
				},
			})),
		};
	})

	.post(
		"/species",
		async ({ body, user, set }) => {
			if (!user) {
				set.status = 401;
				return {
					ok: false,
					error: { code: "UNAUTHORIZED", message: "Authentication required" },
				};
			}

			try {
				const rows = await sql`
					INSERT INTO user_species_alerts (user_id, species_id, min_rarity, radius_km)
					VALUES (${user.id}, ${body.speciesId}, ${body.minRarity ?? "rare"}, ${body.radiusKm ?? 50})
					RETURNING *
				`;

				const r = rows[0];
				set.status = 201;
				return {
					ok: true,
					data: {
						id: r.id,
						userId: r.user_id,
						speciesId: r.species_id,
						minRarity: r.min_rarity,
						radiusKm: Number(r.radius_km),
						active: r.active,
						createdAt: (r.created_at as Date).toISOString(),
					},
				};
			} catch (e: unknown) {
				if ((e as { code?: string }).code === "23505") {
					set.status = 409;
					return {
						ok: false,
						error: {
							code: "DUPLICATE",
							message: "Alert for this species already exists",
						},
					};
				}
				throw e;
			}
		},
		{
			body: t.Object({
				speciesId: t.String({ format: "uuid" }),
				minRarity: t.Optional(
					t.Union([
						t.Literal("common"),
						t.Literal("uncommon"),
						t.Literal("rare"),
						t.Literal("mega_rare"),
					]),
				),
				radiusKm: t.Optional(t.Number({ minimum: 1, maximum: 500 })),
			}),
		},
	)

	.delete(
		"/species/:id",
		async ({ params, user, set }) => {
			if (!user) {
				set.status = 401;
				return {
					ok: false,
					error: { code: "UNAUTHORIZED", message: "Authentication required" },
				};
			}

			const rows = await sql`
				DELETE FROM user_species_alerts
				WHERE id = ${params.id} AND user_id = ${user.id}
				RETURNING id
			`;

			if (rows.length === 0) {
				set.status = 404;
				return { ok: false, error: { code: "NOT_FOUND", message: "Alert not found" } };
			}

			return { ok: true, data: { deleted: true } };
		},
		{
			params: t.Object({
				id: t.String({ format: "uuid" }),
			}),
		},
	)

	// ─── Location Alerts ─────────────────────────────────────────

	.get("/location", async ({ user, set }) => {
		if (!user) {
			set.status = 401;
			return { ok: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } };
		}

		const rows = await sql`
			SELECT id, user_id,
			       ST_Y(location::geometry) AS lat,
			       ST_X(location::geometry) AS lng,
			       radius_km, active, created_at
			FROM user_location_alerts
			WHERE user_id = ${user.id}
			ORDER BY created_at DESC
		`;

		return {
			ok: true,
			data: rows.map((r) => ({
				id: r.id,
				userId: r.user_id,
				lat: Number(r.lat),
				lng: Number(r.lng),
				radiusKm: Number(r.radius_km),
				active: r.active,
				createdAt: (r.created_at as Date).toISOString(),
			})),
		};
	})

	.post(
		"/location",
		async ({ body, user, set }) => {
			if (!user) {
				set.status = 401;
				return {
					ok: false,
					error: { code: "UNAUTHORIZED", message: "Authentication required" },
				};
			}

			const rows = await sql`
				INSERT INTO user_location_alerts (user_id, location, radius_km)
				VALUES (
					${user.id},
					ST_SetSRID(ST_MakePoint(${body.lng}, ${body.lat}), 4326)::geography,
					${body.radiusKm ?? 25}
				)
				RETURNING id, user_id,
				          ST_Y(location::geometry) AS lat,
				          ST_X(location::geometry) AS lng,
				          radius_km, active, created_at
			`;

			const r = rows[0];
			set.status = 201;
			return {
				ok: true,
				data: {
					id: r.id,
					userId: r.user_id,
					lat: Number(r.lat),
					lng: Number(r.lng),
					radiusKm: Number(r.radius_km),
					active: r.active,
					createdAt: (r.created_at as Date).toISOString(),
				},
			};
		},
		{
			body: t.Object({
				lat: t.Number({ minimum: -90, maximum: 90 }),
				lng: t.Number({ minimum: -180, maximum: 180 }),
				radiusKm: t.Optional(t.Number({ minimum: 1, maximum: 500 })),
			}),
		},
	)

	.delete(
		"/location/:id",
		async ({ params, user, set }) => {
			if (!user) {
				set.status = 401;
				return {
					ok: false,
					error: { code: "UNAUTHORIZED", message: "Authentication required" },
				};
			}

			const rows = await sql`
				DELETE FROM user_location_alerts
				WHERE id = ${params.id} AND user_id = ${user.id}
				RETURNING id
			`;

			if (rows.length === 0) {
				set.status = 404;
				return { ok: false, error: { code: "NOT_FOUND", message: "Alert not found" } };
			}

			return { ok: true, data: { deleted: true } };
		},
		{
			params: t.Object({
				id: t.String({ format: "uuid" }),
			}),
		},
	);
