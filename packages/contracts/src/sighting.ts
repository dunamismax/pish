import { z } from "zod";

// ─── Enums ───────────────────────────────────────────────────────
export const SightingRaritySchema = z.enum(["common", "uncommon", "rare", "mega_rare"]);
export const SightingStatusSchema = z.enum(["unconfirmed", "confirmed", "flagged", "removed"]);

// ─── Sighting ────────────────────────────────────────────────────
export const SightingSchema = z.object({
	id: z.string().uuid(),
	userId: z.string().uuid(),
	speciesId: z.string().uuid(),
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
	locationName: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
	rarity: SightingRaritySchema,
	status: SightingStatusSchema,
	confirmationCount: z.number().int().min(0),
	photoUrls: z.array(z.string()),
	audioUrl: z.string().nullable().optional(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const SightingCreateSchema = z.object({
	speciesId: z.string().uuid(),
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
	locationName: z.string().max(200).optional(),
	notes: z.string().max(2000).optional(),
	photoUrls: z.array(z.string()).max(10).optional(),
	audioUrl: z.string().optional(),
	regionCode: z.string().optional(),
});

export const SightingSearchQuerySchema = z.object({
	lat: z.coerce.number().min(-90).max(90).optional(),
	lng: z.coerce.number().min(-180).max(180).optional(),
	radiusKm: z.coerce.number().min(0.1).max(500).default(25),
	speciesId: z.string().uuid().optional(),
	status: SightingStatusSchema.optional(),
	rarity: SightingRaritySchema.optional(),
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Confirmation ────────────────────────────────────────────────
export const SightingConfirmationSchema = z.object({
	id: z.string().uuid(),
	sightingId: z.string().uuid(),
	userId: z.string().uuid(),
	photoUrl: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
	createdAt: z.string().datetime(),
});

export const SightingConfirmationCreateSchema = z.object({
	photoUrl: z.string().optional(),
	notes: z.string().max(1000).optional(),
});

// ─── Flag ────────────────────────────────────────────────────────
export const SightingFlagSchema = z.object({
	id: z.string().uuid(),
	sightingId: z.string().uuid(),
	userId: z.string().uuid(),
	reason: z.string(),
	resolved: z.boolean(),
	resolvedBy: z.string().uuid().nullable().optional(),
	resolvedAt: z.string().datetime().nullable().optional(),
	createdAt: z.string().datetime(),
});

export const SightingFlagCreateSchema = z.object({
	reason: z.string().min(5).max(1000),
});

// ─── Types ───────────────────────────────────────────────────────
export type SightingRarity = z.infer<typeof SightingRaritySchema>;
export type SightingStatus = z.infer<typeof SightingStatusSchema>;
export type Sighting = z.infer<typeof SightingSchema>;
export type SightingCreate = z.infer<typeof SightingCreateSchema>;
export type SightingSearchQuery = z.infer<typeof SightingSearchQuerySchema>;
export type SightingConfirmation = z.infer<typeof SightingConfirmationSchema>;
export type SightingConfirmationCreate = z.infer<typeof SightingConfirmationCreateSchema>;
export type SightingFlag = z.infer<typeof SightingFlagSchema>;
export type SightingFlagCreate = z.infer<typeof SightingFlagCreateSchema>;
