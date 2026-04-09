import { describe, expect, test } from "bun:test";
import {
	addMonths,
	countElapsedQuarters,
	decayFalseReportCount,
	determineModerationStatus,
} from "../lib/false-reports";

describe("false report decay", () => {
	test("adds months without overflowing month boundaries", () => {
		const january31 = new Date(Date.UTC(2026, 0, 31, 12, 0, 0));
		const april30 = addMonths(january31, 3);
		expect(april30.toISOString()).toBe("2026-04-30T12:00:00.000Z");
	});

	test("counts whole elapsed quarters only", () => {
		const start = new Date(Date.UTC(2026, 0, 15, 0, 0, 0));
		const beforeQuarter = new Date(Date.UTC(2026, 3, 14, 23, 59, 59));
		const afterQuarter = new Date(Date.UTC(2026, 3, 15, 0, 0, 0));
		expect(countElapsedQuarters(start, beforeQuarter)).toBe(0);
		expect(countElapsedQuarters(start, afterQuarter)).toBe(1);
	});

	test("decays one false report per quarter and never goes negative", () => {
		const start = new Date(Date.UTC(2025, 0, 1, 0, 0, 0));
		const now = new Date(Date.UTC(2025, 9, 1, 0, 0, 0));
		const result = decayFalseReportCount(2, start, now);
		expect(result.count).toBe(0);
		expect(result.quartersElapsed).toBe(3);
		expect(result.lastDecayAt.toISOString()).toBe("2025-10-01T00:00:00.000Z");
	});
});

describe("determineModerationStatus", () => {
	test("leaves clean reports unconfirmed", () => {
		expect(determineModerationStatus(1, 1)).toBe("unconfirmed");
	});

	test("flags sightings at three local flags", () => {
		expect(determineModerationStatus(3, 1)).toBe("flagged");
	});

	test("flags sightings when reporter reaches five false reports", () => {
		expect(determineModerationStatus(1, 5)).toBe("flagged");
	});

	test("removes sightings at five local flags or ten reporter false reports", () => {
		expect(determineModerationStatus(5, 1)).toBe("removed");
		expect(determineModerationStatus(1, 10)).toBe("removed");
	});
});
