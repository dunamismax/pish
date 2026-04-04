import { z } from "zod";

export const RaritySchema = z.enum(["common", "uncommon", "rare", "mega_rare"]);

export const SpeciesCategorySchema = z.enum([
	"species",
	"issf",
	"slash",
	"spuh",
	"hybrid",
	"form",
	"domestic",
]);

export const SpeciesSchema = z.object({
	id: z.string().uuid(),
	speciesCode: z.string(),
	commonName: z.string(),
	scientificName: z.string(),
	familyCommonName: z.string().nullable().optional(),
	familyScientificName: z.string().nullable().optional(),
	order: z.string().nullable().optional(),
	category: z.string().nullable().optional(),
	taxonOrder: z.number().nullable().optional(),
});

export const SpeciesSearchResultSchema = z.object({
	id: z.string(),
	speciesCode: z.string(),
	commonName: z.string(),
	scientificName: z.string(),
	familyCommonName: z.string().nullable().optional(),
});

export const SpeciesSearchQuerySchema = z.object({
	q: z.string().min(1),
	limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const SpeciesFrequencySchema = z.object({
	month: z.number().int().min(1).max(12),
	frequency: z.number().min(0).max(1),
	sampleSize: z.number().int().nullable(),
});

export const SpeciesFrequencyQuerySchema = z.object({
	regionCode: z.string(),
});

export type Rarity = z.infer<typeof RaritySchema>;
export type SpeciesCategory = z.infer<typeof SpeciesCategorySchema>;
export type Species = z.infer<typeof SpeciesSchema>;
export type SpeciesSearchResult = z.infer<typeof SpeciesSearchResultSchema>;
export type SpeciesSearchQuery = z.infer<typeof SpeciesSearchQuerySchema>;
export type SpeciesFrequency = z.infer<typeof SpeciesFrequencySchema>;
export type SpeciesFrequencyQuery = z.infer<typeof SpeciesFrequencyQuerySchema>;
