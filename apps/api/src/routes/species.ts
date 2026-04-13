import { Elysia, t } from "elysia";
import { sql } from "../lib/db";
import { meili, SPECIES_INDEX } from "../lib/search";
import { sessionMiddleware } from "../middleware/auth";

export const speciesRoutes = new Elysia({ prefix: "/api/species" })
	.use(sessionMiddleware)

	// ─── Search Species (MeiliSearch) ────────────────────────────────
	.get(
		"/search",
		async ({ query }) => {
			const { q, limit } = query;

			const results = await meili.index(SPECIES_INDEX).search(q, {
				limit: limit || 10,
				attributesToRetrieve: [
					"id",
					"speciesCode",
					"commonName",
					"scientificName",
					"familyCommonName",
				],
			});

			return {
				ok: true,
				data: {
					hits: results.hits,
					estimatedTotalHits: results.estimatedTotalHits,
					processingTimeMs: results.processingTimeMs,
				},
			};
		},
		{
			query: t.Object({
				q: t.String({ minLength: 1 }),
				limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
			}),
		},
	)

	// ─── Get Species by ID ───────────────────────────────────────────
	.get(
		"/:id",
		async ({ params, set }) => {
			const rows = await sql`
				SELECT id, species_code, common_name, scientific_name,
					   family_common_name, family_scientific_name,
					   taxonomic_order, category, taxon_order
				FROM species
				WHERE id = ${params.id}
			`;

			if (rows.length === 0) {
				set.status = 404;
				return { ok: false, error: { code: "NOT_FOUND", message: "Species not found" } };
			}

			const s = rows[0];
			return {
				ok: true,
				data: {
					id: s.id,
					speciesCode: s.species_code,
					commonName: s.common_name,
					scientificName: s.scientific_name,
					familyCommonName: s.family_common_name,
					familyScientificName: s.family_scientific_name,
					order: s.taxonomic_order,
					category: s.category,
					taxonOrder: s.taxon_order,
				},
			};
		},
		{
			params: t.Object({
				id: t.String({ format: "uuid" }),
			}),
		},
	)

	// ─── Get Species by Code ─────────────────────────────────────────
	.get(
		"/code/:code",
		async ({ params, set }) => {
			const rows = await sql`
				SELECT id, species_code, common_name, scientific_name,
					   family_common_name, family_scientific_name,
					   taxonomic_order, category, taxon_order
				FROM species
				WHERE species_code = ${params.code}
			`;

			if (rows.length === 0) {
				set.status = 404;
				return { ok: false, error: { code: "NOT_FOUND", message: "Species not found" } };
			}

			const s = rows[0];
			return {
				ok: true,
				data: {
					id: s.id,
					speciesCode: s.species_code,
					commonName: s.common_name,
					scientificName: s.scientific_name,
					familyCommonName: s.family_common_name,
					familyScientificName: s.family_scientific_name,
					order: s.taxonomic_order,
					category: s.category,
					taxonOrder: s.taxon_order,
				},
			};
		},
		{
			params: t.Object({
				code: t.String(),
			}),
		},
	)

	// ─── Get Frequency Data ──────────────────────────────────────────
	.get(
		"/:id/frequency",
		async ({ params, query }) => {
			const { regionCode } = query;

			const rows = await sql`
				SELECT month, frequency, sample_size
				FROM species_frequency
				WHERE species_id = ${params.id}
				  AND region_code = ${regionCode}
				ORDER BY month
			`;

			return {
				ok: true,
				data: rows.map((r) => ({
					month: r.month,
					frequency: r.frequency,
					sampleSize: r.sample_size,
				})),
			};
		},
		{
			params: t.Object({
				id: t.String({ format: "uuid" }),
			}),
			query: t.Object({
				regionCode: t.String(),
			}),
		},
	)

	// ─── Species Profile (enriched data for profile page) ──────────
	.get(
		"/:id/profile",
		async ({ params, user }) => {
			const speciesId = params.id;

			// Fetch base species data
			const speciesRows = await sql`
				SELECT id, species_code, common_name, scientific_name,
					   family_common_name, family_scientific_name,
					   taxonomic_order, category, taxon_order
				FROM species
				WHERE id = ${speciesId}
			`;

			if (speciesRows.length === 0) {
				return { ok: false, error: { code: "NOT_FOUND", message: "Species not found" } };
			}

			const s = speciesRows[0];

			// Community photos: recent sightings with photos for this species
			const photoRows = await sql`
				SELECT sg.id AS sighting_id, sg.photo_urls, sg.lat, sg.lng,
					   sg.location_name, sg.created_at,
					   u.username AS observer_username
				FROM sightings sg
				LEFT JOIN users u ON u.id = sg.user_id
				WHERE sg.species_id = ${speciesId}
				  AND sg.status IN ('confirmed', 'unconfirmed')
				  AND sg.photo_urls IS NOT NULL
				  AND sg.photo_urls != '[]'::jsonb
				ORDER BY sg.created_at DESC
				LIMIT 12
			`;

			const communityPhotos = photoRows.map((r) => ({
				sightingId: r.sighting_id,
				photoUrls: r.photo_urls as string[],
				lat: Number(r.lat),
				lng: Number(r.lng),
				locationName: r.location_name ?? null,
				observerUsername: r.observer_username ?? null,
				createdAt: (r.created_at as Date).toISOString(),
			}));

			// Community audio: recent sightings with audio
			const audioRows = await sql`
				SELECT sg.id AS sighting_id, sg.audio_url, sg.lat, sg.lng,
					   sg.location_name, sg.created_at,
					   u.username AS observer_username
				FROM sightings sg
				LEFT JOIN users u ON u.id = sg.user_id
				WHERE sg.species_id = ${speciesId}
				  AND sg.status IN ('confirmed', 'unconfirmed')
				  AND sg.audio_url IS NOT NULL
				ORDER BY sg.created_at DESC
				LIMIT 6
			`;

			const communityAudio = audioRows.map((r) => ({
				sightingId: r.sighting_id,
				audioUrl: r.audio_url as string,
				lat: Number(r.lat),
				lng: Number(r.lng),
				locationName: r.location_name ?? null,
				observerUsername: r.observer_username ?? null,
				createdAt: (r.created_at as Date).toISOString(),
			}));

			// Similar species: same family, exclude self, limited to actual species
			const similarRows = await sql`
				SELECT id, species_code, common_name, scientific_name
				FROM species
				WHERE family_scientific_name = ${s.family_scientific_name}
				  AND id != ${speciesId}
				  AND category = 'species'
				ORDER BY taxon_order ASC
				LIMIT 12
			`;

			const similarSpecies = similarRows.map((r) => ({
				id: r.id,
				speciesCode: r.species_code,
				commonName: r.common_name,
				scientificName: r.scientific_name,
			}));

			// Recent sighting locations for mini range map
			const sightingLocationRows = await sql`
				SELECT lat, lng, rarity, status, created_at
				FROM sightings
				WHERE species_id = ${speciesId}
				  AND status IN ('confirmed', 'unconfirmed')
				ORDER BY created_at DESC
				LIMIT 100
			`;

			const sightingLocations = sightingLocationRows.map((r) => ({
				lat: Number(r.lat),
				lng: Number(r.lng),
				rarity: r.rarity as string,
				status: r.status as string,
				createdAt: (r.created_at as Date).toISOString(),
			}));

			// Total sighting count for this species
			const countRows = await sql`
				SELECT COUNT(*)::int AS total
				FROM sightings
				WHERE species_id = ${speciesId}
				  AND status IN ('confirmed', 'unconfirmed')
			`;
			const totalSightings = countRows[0].total;

			// Personal history (only if authenticated)
			let personalHistory = null;
			if (user) {
				const userSightingRows = await sql`
					SELECT id, lat, lng, location_name, photo_urls, audio_url,
						   rarity, status, created_at
					FROM sightings
					WHERE species_id = ${speciesId}
					  AND user_id = ${user.id}
					ORDER BY created_at ASC
				`;

				if (userSightingRows.length > 0) {
					const first = userSightingRows[0];
					const userPhotos: string[] = [];
					for (const row of userSightingRows) {
						const urls = row.photo_urls as string[] | null;
						if (urls && Array.isArray(urls)) {
							userPhotos.push(...urls);
						}
					}

					personalHistory = {
						totalSightings: userSightingRows.length,
						firstSighting: {
							id: first.id,
							locationName: first.location_name ?? null,
							createdAt: (first.created_at as Date).toISOString(),
						},
						userPhotos: userPhotos.slice(0, 20),
					};
				}
			}

			return {
				ok: true,
				data: {
					species: {
						id: s.id,
						speciesCode: s.species_code,
						commonName: s.common_name,
						scientificName: s.scientific_name,
						familyCommonName: s.family_common_name,
						familyScientificName: s.family_scientific_name,
						order: s.taxonomic_order,
						category: s.category,
						taxonOrder: s.taxon_order,
					},
					communityPhotos,
					communityAudio,
					similarSpecies,
					sightingLocations,
					totalSightings,
					personalHistory,
				},
			};
		},
		{
			params: t.Object({
				id: t.String({ format: "uuid" }),
			}),
		},
	)

	// ─── Likely Here Now ────────────────────────────────────────────
	.get(
		"/likely-here",
		async ({ query }) => {
			const { lat, lng, regionCode, limit } = query;
			const month = new Date().getMonth() + 1;
			const region = regionCode || "US";
			const lim = limit || 20;

			const rows = await sql`
				SELECT
					s.id, s.species_code, s.common_name, s.scientific_name,
					s.family_common_name, sf.frequency, sf.sample_size
				FROM species_frequency sf
				JOIN species s ON s.id = sf.species_id
				WHERE sf.region_code = ${region}
				  AND sf.month = ${month}
				  AND sf.frequency > 0
				  AND s.category = 'species'
				ORDER BY sf.frequency DESC
				LIMIT ${lim}
			`;

			return {
				ok: true,
				data: rows.map((r) => ({
					id: r.id,
					speciesCode: r.species_code,
					commonName: r.common_name,
					scientificName: r.scientific_name,
					familyCommonName: r.family_common_name,
					frequency: Number(r.frequency),
					sampleSize: r.sample_size ? Number(r.sample_size) : null,
				})),
				meta: {
					month,
					regionCode: region,
					lat: Number(lat),
					lng: Number(lng),
				},
			};
		},
		{
			query: t.Object({
				lat: t.Numeric({ minimum: -90, maximum: 90 }),
				lng: t.Numeric({ minimum: -180, maximum: 180 }),
				regionCode: t.Optional(t.String()),
				limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
			}),
		},
	);
