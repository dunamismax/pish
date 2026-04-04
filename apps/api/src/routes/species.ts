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
	);
