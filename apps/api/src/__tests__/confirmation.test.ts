import { describe, expect, test } from "bun:test";
import {
	calculateRequiredConfirmations,
	determineConfirmationStatus,
	determineInitialStatus,
} from "../lib/confirmation";

describe("calculateRequiredConfirmations", () => {
	test("requires only one additional confirmation for trusted reporters", () => {
		expect(
			calculateRequiredConfirmations({
				rarity: "rare",
				reporterRole: "trusted",
				falseReportCount: 0,
			}),
		).toBe(1);
	});

	test("requires three confirmations for new users on rare sightings", () => {
		expect(
			calculateRequiredConfirmations({
				rarity: "rare",
				reporterRole: "new_user",
				falseReportCount: 0,
			}),
		).toBe(3);
	});

	test("raises thresholds once false report count reaches three", () => {
		expect(
			calculateRequiredConfirmations({
				rarity: "rare",
				reporterRole: "user",
				falseReportCount: 3,
			}),
		).toBe(3);
	});

	test("forces moderator review after five false reports", () => {
		expect(
			calculateRequiredConfirmations({
				rarity: "mega_rare",
				reporterRole: "user",
				falseReportCount: 5,
			}),
		).toBe(999);
	});
});

describe("determineConfirmationStatus", () => {
	test("trusted confirmer immediately confirms mega rare sighting", () => {
		expect(
			determineConfirmationStatus({
				rarity: "mega_rare",
				currentConfirmationCount: 1,
				requiredConfirmations: 2,
				confirmingUserRole: "regional_mod",
			}),
		).toBe("confirmed");
	});

	test("standard confirmer does not bypass threshold", () => {
		expect(
			determineConfirmationStatus({
				rarity: "mega_rare",
				currentConfirmationCount: 1,
				requiredConfirmations: 2,
				confirmingUserRole: "user",
			}),
		).toBe("unconfirmed");
	});
});

describe("determineInitialStatus", () => {
	test("auto-confirms common sightings", () => {
		expect(determineInitialStatus("common", 0)).toBe("confirmed");
	});

	test("flags high-risk reporters for moderator review", () => {
		expect(determineInitialStatus("rare", 5)).toBe("flagged");
	});

	test("removes reporters pending review after ten false reports", () => {
		expect(determineInitialStatus("rare", 10)).toBe("removed");
	});
});
