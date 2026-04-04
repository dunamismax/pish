import { Elysia, t } from "elysia";
import { sql } from "../lib/db";
import { sessionMiddleware } from "../middleware/auth";

export const hotspotRoutes = new Elysia({ prefix: "/api/hotspots" })
	.use(sessionMiddleware)

	// ─── Nearby Hotspots ─────────────────────────────────────────
	.get(
		"/nearby",
		async ({ query }) => {
			const { lat, lng, radiusKm, limit } = query;
			const radiusMeters = (radiusKm ?? 25) * 1000;
			const lim = limit ?? 20;

			const rows = await sql`
				SELECT
					id, name, lat, lng, country_code, region_code,
					species_count, latest_observation_date,
					ST_Distance(
						location,
						ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
					) AS distance_meters
				FROM hotspots
				WHERE ST_DWithin(
					location,
					ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
					${radiusMeters}
				)
				ORDER BY distance_meters ASC
				LIMIT ${lim}
			`;

			return {
				ok: true,
				data: rows.map((r) => ({
					id: r.id,
					name: r.name,
					lat: Number(r.lat),
					lng: Number(r.lng),
					countryCode: r.country_code,
					regionCode: r.region_code,
					speciesCount: r.species_count ? Number(r.species_count) : null,
					latestObservationDate: r.latest_observation_date
						? (r.latest_observation_date as Date).toISOString().split("T")[0]
						: null,
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
			}),
		},
	);
