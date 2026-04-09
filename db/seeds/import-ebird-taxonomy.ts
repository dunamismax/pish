/**
 * eBird taxonomy import script.
 *
 * Downloads the eBird taxonomy CSV and imports it into the species table.
 * Also configures the MeiliSearch species index.
 *
 * Usage: bun run db/seeds/import-ebird-taxonomy.ts
 *
 * Requires EBIRD_API_KEY env var for direct API access.
 * Falls back to the public taxonomy CSV endpoint.
 */

import { Meilisearch } from "meilisearch";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL || "postgres://pish:pish@localhost:5432/pish";
const meiliUrl = process.env.MEILISEARCH_URL || "http://localhost:7700";
const meiliKey = process.env.MEILISEARCH_KEY || "pish-dev-key";
const ebirdApiKey = process.env.EBIRD_API_KEY || "";

const sql = postgres(databaseUrl);
const meili = new Meilisearch({ host: meiliUrl, apiKey: meiliKey });

const SPECIES_INDEX = "species";

interface TaxonomyRow {
	speciesCode: string;
	commonName: string;
	scientificName: string;
	familyCommonName: string;
	familySciName: string;
	order: string;
	category: string;
	taxonOrder: number;
}

async function fetchTaxonomy(): Promise<TaxonomyRow[]> {
	console.log("[import] fetching eBird taxonomy...");

	const url = ebirdApiKey
		? "https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=json"
		: "https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=json";

	const headers: Record<string, string> = {};
	if (ebirdApiKey) {
		headers["X-eBirdApiToken"] = ebirdApiKey;
	}

	const res = await fetch(url, { headers });
	if (!res.ok) {
		throw new Error(`Failed to fetch taxonomy: ${res.status} ${res.statusText}`);
	}

	const data = (await res.json()) as Array<{
		speciesCode: string;
		comName: string;
		sciName: string;
		familyComName?: string;
		familySciName?: string;
		order?: string;
		category?: string;
		taxonOrder?: number;
	}>;

	console.log(`[import] received ${data.length} taxa`);

	return data.map((t) => ({
		speciesCode: t.speciesCode,
		commonName: t.comName,
		scientificName: t.sciName,
		familyCommonName: t.familyComName || "",
		familySciName: t.familySciName || "",
		order: t.order || "",
		category: t.category || "",
		taxonOrder: t.taxonOrder || 0,
	}));
}

async function importToDatabase(taxa: TaxonomyRow[]): Promise<void> {
	console.log("[import] importing to database...");

	// Process in batches of 500
	const batchSize = 500;
	let imported = 0;

	for (let i = 0; i < taxa.length; i += batchSize) {
		const batch = taxa.slice(i, i + batchSize);

		await sql.begin(async (tx) => {
			for (const t of batch) {
				await tx`
					INSERT INTO species (
						species_code, common_name, scientific_name,
						family_common_name, family_scientific_name,
						taxonomic_order, category, taxon_order
					) VALUES (
						${t.speciesCode}, ${t.commonName}, ${t.scientificName},
						${t.familyCommonName || null}, ${t.familySciName || null},
						${t.order || null}, ${t.category || null}, ${t.taxonOrder}
					)
					ON CONFLICT (species_code) DO UPDATE SET
						common_name = EXCLUDED.common_name,
						scientific_name = EXCLUDED.scientific_name,
						family_common_name = EXCLUDED.family_common_name,
						family_scientific_name = EXCLUDED.family_scientific_name,
						taxonomic_order = EXCLUDED.taxonomic_order,
						category = EXCLUDED.category,
						taxon_order = EXCLUDED.taxon_order
				`;
			}
		});

		imported += batch.length;
		if (imported % 2000 === 0 || imported === taxa.length) {
			console.log(`[import] database: ${imported}/${taxa.length} taxa`);
		}
	}
}

async function indexInMeiliSearch(): Promise<void> {
	console.log("[import] configuring MeiliSearch index...");

	// Fetch species IDs from database for the index
	const speciesRows = await sql`
		SELECT id, species_code, common_name, scientific_name,
			   family_common_name, taxon_order
		FROM species
		ORDER BY taxon_order ASC NULLS LAST
	`;

	const documents = speciesRows.map((s) => ({
		id: s.id,
		speciesCode: s.species_code,
		commonName: s.common_name,
		scientificName: s.scientific_name,
		familyCommonName: s.family_common_name,
		taxonOrder: s.taxon_order,
	}));

	// Create or update index
	await meili.createIndex(SPECIES_INDEX, { primaryKey: "id" }).catch(() => {
		// Index may already exist
	});

	const index = meili.index(SPECIES_INDEX);

	// Configure searchable attributes
	await index.updateSearchableAttributes([
		"commonName",
		"scientificName",
		"familyCommonName",
		"speciesCode",
	]);

	// Configure filterable and sortable attributes
	await index.updateFilterableAttributes(["familyCommonName", "speciesCode"]);
	await index.updateSortableAttributes(["taxonOrder", "commonName"]);

	// Configure ranking rules for species search
	await index.updateRankingRules(["words", "typo", "proximity", "attribute", "sort", "exactness"]);

	// Add documents in batches
	const batchSize = 5000;
	for (let i = 0; i < documents.length; i += batchSize) {
		const batch = documents.slice(i, i + batchSize);
		await index.addDocuments(batch);
		console.log(
			`[import] MeiliSearch: indexed ${Math.min(i + batchSize, documents.length)}/${documents.length}`,
		);
	}

	console.log("[import] MeiliSearch indexing complete");
}

async function run() {
	try {
		const taxa = await fetchTaxonomy();
		await importToDatabase(taxa);
		await indexInMeiliSearch();
		console.log("[import] done!");
	} catch (err) {
		console.error("[import] failed:", err);
		process.exit(1);
	} finally {
		await sql.end();
	}
}

run();
