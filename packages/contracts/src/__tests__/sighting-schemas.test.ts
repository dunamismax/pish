import { describe, expect, test } from "bun:test";
import {
	LocationAlertCreateSchema,
	LocationAlertSchema,
	NotificationSchema,
	SightingConfirmationCreateSchema,
	SightingConfirmationSchema,
	SightingCreateSchema,
	SightingFlagCreateSchema,
	SightingFlagSchema,
	SightingRaritySchema,
	SightingSchema,
	SightingSearchQuerySchema,
	SightingStatusSchema,
	SpeciesAlertCreateSchema,
	SpeciesAlertSchema,
} from "../index";

describe("SightingRaritySchema", () => {
	test("accepts valid rarities", () => {
		for (const r of ["common", "uncommon", "rare", "mega_rare"]) {
			expect(SightingRaritySchema.safeParse(r).success).toBe(true);
		}
	});

	test("rejects invalid rarity", () => {
		expect(SightingRaritySchema.safeParse("legendary").success).toBe(false);
	});
});

describe("SightingStatusSchema", () => {
	test("accepts valid statuses", () => {
		for (const s of ["unconfirmed", "confirmed", "flagged", "removed"]) {
			expect(SightingStatusSchema.safeParse(s).success).toBe(true);
		}
	});

	test("rejects invalid status", () => {
		expect(SightingStatusSchema.safeParse("pending").success).toBe(false);
	});
});

describe("SightingCreateSchema", () => {
	test("accepts valid create input", () => {
		const result = SightingCreateSchema.safeParse({
			speciesId: "550e8400-e29b-41d4-a716-446655440000",
			lat: 26.142,
			lng: -81.795,
			locationName: "Corkscrew Swamp",
			notes: "Perched on a cypress",
		});
		expect(result.success).toBe(true);
	});

	test("accepts minimal input", () => {
		const result = SightingCreateSchema.safeParse({
			speciesId: "550e8400-e29b-41d4-a716-446655440000",
			lat: 26.142,
			lng: -81.795,
		});
		expect(result.success).toBe(true);
	});

	test("rejects invalid lat", () => {
		const result = SightingCreateSchema.safeParse({
			speciesId: "550e8400-e29b-41d4-a716-446655440000",
			lat: 91,
			lng: -81.795,
		});
		expect(result.success).toBe(false);
	});

	test("rejects invalid lng", () => {
		const result = SightingCreateSchema.safeParse({
			speciesId: "550e8400-e29b-41d4-a716-446655440000",
			lat: 26.142,
			lng: 181,
		});
		expect(result.success).toBe(false);
	});

	test("accepts photo urls", () => {
		const result = SightingCreateSchema.safeParse({
			speciesId: "550e8400-e29b-41d4-a716-446655440000",
			lat: 26.142,
			lng: -81.795,
			photoUrls: ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"],
		});
		expect(result.success).toBe(true);
	});

	test("rejects too many photos", () => {
		const result = SightingCreateSchema.safeParse({
			speciesId: "550e8400-e29b-41d4-a716-446655440000",
			lat: 26.142,
			lng: -81.795,
			photoUrls: Array(11).fill("https://example.com/photo.jpg"),
		});
		expect(result.success).toBe(false);
	});
});

describe("SightingSchema", () => {
	test("accepts valid sighting", () => {
		const result = SightingSchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
			userId: "550e8400-e29b-41d4-a716-446655440001",
			speciesId: "550e8400-e29b-41d4-a716-446655440002",
			lat: 26.142,
			lng: -81.795,
			locationName: "Corkscrew Swamp",
			notes: null,
			rarity: "rare",
			status: "unconfirmed",
			confirmationCount: 0,
			photoUrls: [],
			audioUrl: null,
			createdAt: "2026-01-01T00:00:00.000Z",
			updatedAt: "2026-01-01T00:00:00.000Z",
		});
		expect(result.success).toBe(true);
	});
});

describe("SightingSearchQuerySchema", () => {
	test("uses defaults", () => {
		const result = SightingSearchQuerySchema.parse({});
		expect(result.radiusKm).toBe(25);
		expect(result.page).toBe(1);
		expect(result.limit).toBe(20);
	});

	test("accepts location filter", () => {
		const result = SightingSearchQuerySchema.parse({
			lat: "26.142",
			lng: "-81.795",
			radiusKm: "10",
		});
		expect(result.lat).toBe(26.142);
		expect(result.lng).toBe(-81.795);
		expect(result.radiusKm).toBe(10);
	});
});

describe("SightingConfirmationCreateSchema", () => {
	test("accepts valid confirmation", () => {
		const result = SightingConfirmationCreateSchema.safeParse({
			notes: "I can confirm, saw it too",
		});
		expect(result.success).toBe(true);
	});

	test("accepts empty object", () => {
		const result = SightingConfirmationCreateSchema.safeParse({});
		expect(result.success).toBe(true);
	});
});

describe("SightingConfirmationSchema", () => {
	test("accepts valid confirmation", () => {
		const result = SightingConfirmationSchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
			sightingId: "550e8400-e29b-41d4-a716-446655440001",
			userId: "550e8400-e29b-41d4-a716-446655440002",
			photoUrl: null,
			notes: null,
			createdAt: "2026-01-01T00:00:00.000Z",
		});
		expect(result.success).toBe(true);
	});
});

describe("SightingFlagCreateSchema", () => {
	test("accepts valid flag", () => {
		const result = SightingFlagCreateSchema.safeParse({
			reason: "This is a misidentified species",
		});
		expect(result.success).toBe(true);
	});

	test("rejects short reason", () => {
		const result = SightingFlagCreateSchema.safeParse({ reason: "bad" });
		expect(result.success).toBe(false);
	});
});

describe("SightingFlagSchema", () => {
	test("accepts valid flag", () => {
		const result = SightingFlagSchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
			sightingId: "550e8400-e29b-41d4-a716-446655440001",
			userId: "550e8400-e29b-41d4-a716-446655440002",
			reason: "Misidentification",
			resolved: false,
			resolvedBy: null,
			resolvedAt: null,
			createdAt: "2026-01-01T00:00:00.000Z",
		});
		expect(result.success).toBe(true);
	});
});

describe("SpeciesAlertCreateSchema", () => {
	test("accepts valid species alert", () => {
		const result = SpeciesAlertCreateSchema.safeParse({
			speciesId: "550e8400-e29b-41d4-a716-446655440000",
			minRarity: "rare",
			radiusKm: 50,
		});
		expect(result.success).toBe(true);
	});

	test("uses defaults", () => {
		const result = SpeciesAlertCreateSchema.parse({
			speciesId: "550e8400-e29b-41d4-a716-446655440000",
		});
		expect(result.minRarity).toBe("rare");
		expect(result.radiusKm).toBe(50);
	});
});

describe("SpeciesAlertSchema", () => {
	test("accepts valid species alert", () => {
		const result = SpeciesAlertSchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
			userId: "550e8400-e29b-41d4-a716-446655440001",
			speciesId: "550e8400-e29b-41d4-a716-446655440002",
			minRarity: "rare",
			radiusKm: 50,
			active: true,
			createdAt: "2026-01-01T00:00:00.000Z",
		});
		expect(result.success).toBe(true);
	});
});

describe("LocationAlertCreateSchema", () => {
	test("accepts valid location alert", () => {
		const result = LocationAlertCreateSchema.safeParse({
			lat: 26.142,
			lng: -81.795,
			radiusKm: 25,
		});
		expect(result.success).toBe(true);
	});

	test("uses default radius", () => {
		const result = LocationAlertCreateSchema.parse({
			lat: 26.142,
			lng: -81.795,
		});
		expect(result.radiusKm).toBe(25);
	});
});

describe("LocationAlertSchema", () => {
	test("accepts valid location alert", () => {
		const result = LocationAlertSchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
			userId: "550e8400-e29b-41d4-a716-446655440001",
			lat: 26.142,
			lng: -81.795,
			radiusKm: 25,
			active: true,
			createdAt: "2026-01-01T00:00:00.000Z",
		});
		expect(result.success).toBe(true);
	});
});

describe("NotificationSchema", () => {
	test("accepts valid notification", () => {
		const result = NotificationSchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
			userId: "550e8400-e29b-41d4-a716-446655440001",
			type: "species_alert",
			title: "Bald Eagle spotted!",
			body: "A rare Bald Eagle was reported near Corkscrew Swamp.",
			data: { sightingId: "abc123" },
			read: false,
			createdAt: "2026-01-01T00:00:00.000Z",
		});
		expect(result.success).toBe(true);
	});
});
