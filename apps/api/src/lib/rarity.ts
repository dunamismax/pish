import type { SightingRarity } from "@pish/contracts";
import { sql } from "./db";

/**
 * Auto-classify rarity based on eBird frequency data for the species
 * in a region during the current month.
 *
 * - common:    frequency > 30%
 * - uncommon:  10-30%
 * - rare:      1-10%
 * - mega_rare: < 1%
 *
 * Falls back to "uncommon" when no frequency data is available.
 */
export async function classifyRarity(
	speciesId: string,
	regionCode?: string,
): Promise<SightingRarity> {
	const month = new Date().getMonth() + 1;
	const region = regionCode || "US";

	const rows = await sql`
		SELECT frequency
		FROM species_frequency
		WHERE species_id = ${speciesId}
		  AND region_code = ${region}
		  AND month = ${month}
		LIMIT 1
	`;

	if (rows.length === 0) {
		return "uncommon";
	}

	const frequency = Number(rows[0].frequency);

	if (frequency > 0.3) return "common";
	if (frequency >= 0.1) return "uncommon";
	if (frequency >= 0.01) return "rare";
	return "mega_rare";
}
