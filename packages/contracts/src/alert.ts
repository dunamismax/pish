import { z } from "zod";
import { SightingRaritySchema } from "./sighting";

// ─── Species Alert ───────────────────────────────────────────────
export const SpeciesAlertSchema = z.object({
	id: z.string().uuid(),
	userId: z.string().uuid(),
	speciesId: z.string().uuid(),
	minRarity: SightingRaritySchema,
	radiusKm: z.number(),
	active: z.boolean(),
	createdAt: z.string().datetime(),
});

export const SpeciesAlertCreateSchema = z.object({
	speciesId: z.string().uuid(),
	minRarity: SightingRaritySchema.default("rare"),
	radiusKm: z.number().min(1).max(500).default(50),
});

// ─── Location Alert ──────────────────────────────────────────────
export const LocationAlertSchema = z.object({
	id: z.string().uuid(),
	userId: z.string().uuid(),
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
	radiusKm: z.number(),
	active: z.boolean(),
	createdAt: z.string().datetime(),
});

export const LocationAlertCreateSchema = z.object({
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
	radiusKm: z.number().min(1).max(500).default(25),
});

// ─── Types ───────────────────────────────────────────────────────
export type SpeciesAlert = z.infer<typeof SpeciesAlertSchema>;
export type SpeciesAlertCreate = z.infer<typeof SpeciesAlertCreateSchema>;
export type LocationAlert = z.infer<typeof LocationAlertSchema>;
export type LocationAlertCreate = z.infer<typeof LocationAlertCreateSchema>;
