import { describe, expect, test } from "bun:test";
import { classifyRarityFromFrequency } from "../lib/rarity";

describe("classifyRarityFromFrequency", () => {
	test("classifies common sightings above 30%", () => {
		expect(classifyRarityFromFrequency(0.45)).toBe("common");
	});

	test("classifies uncommon sightings between 10% and 30%", () => {
		expect(classifyRarityFromFrequency(0.1)).toBe("uncommon");
		expect(classifyRarityFromFrequency(0.3)).toBe("uncommon");
	});

	test("classifies rare sightings between 1% and 10%", () => {
		expect(classifyRarityFromFrequency(0.01)).toBe("rare");
		expect(classifyRarityFromFrequency(0.09)).toBe("rare");
	});

	test("classifies mega rare sightings below 1%", () => {
		expect(classifyRarityFromFrequency(0.009)).toBe("mega_rare");
	});

	test("falls back to uncommon when no frequency exists", () => {
		expect(classifyRarityFromFrequency(null)).toBe("uncommon");
	});
});
