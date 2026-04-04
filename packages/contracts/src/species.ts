import { z } from "zod";

export const RaritySchema = z.enum(["common", "uncommon", "rare", "mega_rare"]);

export const SpeciesSchema = z.object({
	id: z.string().uuid(),
	speciesCode: z.string(),
	commonName: z.string(),
	scientificName: z.string(),
	familyCommonName: z.string().optional(),
	familyScientificName: z.string().optional(),
	order: z.string().optional(),
	category: z.string().optional(),
	taxonOrder: z.number().optional(),
});

export const SpeciesSearchResultSchema = z.object({
	id: z.string(),
	commonName: z.string(),
	scientificName: z.string(),
	familyCommonName: z.string().optional(),
});

export type Rarity = z.infer<typeof RaritySchema>;
export type Species = z.infer<typeof SpeciesSchema>;
export type SpeciesSearchResult = z.infer<typeof SpeciesSearchResultSchema>;
