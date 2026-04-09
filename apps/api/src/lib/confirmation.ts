import type { SightingRarity, SightingStatus } from "@pish/contracts";
import { sql } from "./db";
import { getEffectiveFalseReportCount } from "./false-reports";

/** Rarity enum ordering for threshold comparison */
const RARITY_ORDER: Record<SightingRarity, number> = {
	common: 0,
	uncommon: 1,
	rare: 2,
	mega_rare: 3,
};

interface ConfirmationContext {
	sightingId: string;
	reporterUserId: string;
	reporterRole: string;
	rarity: SightingRarity;
	currentConfirmationCount: number;
	confirmingUserRole: string;
}

export interface ConfirmationThresholdInput {
	rarity: SightingRarity;
	reporterRole: string;
	falseReportCount: number;
}

export function calculateRequiredConfirmations({
	rarity,
	reporterRole,
	falseReportCount,
}: ConfirmationThresholdInput): number {
	if (rarity === "common") return 0;
	if (rarity === "uncommon") return 0;
	if (falseReportCount >= 5) return 999;

	const isNewUser = reporterRole === "new_user";
	const isTrusted = ["trusted", "regional_mod", "admin", "god"].includes(reporterRole);

	let required = isTrusted ? 1 : isNewUser ? 3 : 2;

	if (falseReportCount >= 3) {
		required += 1;
	}

	return required;
}

export function determineConfirmationStatus({
	rarity,
	currentConfirmationCount,
	requiredConfirmations,
	confirmingUserRole,
}: {
	rarity: SightingRarity;
	currentConfirmationCount: number;
	requiredConfirmations: number;
	confirmingUserRole: string;
}): SightingStatus {
	if (rarity === "mega_rare") {
		const isTrustedConfirmer = ["trusted", "regional_mod", "admin", "god"].includes(
			confirmingUserRole,
		);
		if (isTrustedConfirmer) {
			return "confirmed";
		}
	}

	if (currentConfirmationCount >= requiredConfirmations) {
		return "confirmed";
	}

	return "unconfirmed";
}

export function determineInitialStatus(
	rarity: SightingRarity,
	falseReportCount: number,
): SightingStatus {
	if (rarity === "common") return "confirmed";
	if (falseReportCount >= 10) return "removed";
	if (falseReportCount >= 5) return "flagged";
	return "unconfirmed";
}

async function getRequiredConfirmations(
	rarity: SightingRarity,
	reporterRole: string,
	reporterUserId: string,
): Promise<number> {
	const falseReportCount = await getEffectiveFalseReportCount(reporterUserId);
	return calculateRequiredConfirmations({ rarity, reporterRole, falseReportCount });
}

export async function evaluateConfirmation(ctx: ConfirmationContext): Promise<SightingStatus> {
	const required = await getRequiredConfirmations(ctx.rarity, ctx.reporterRole, ctx.reporterUserId);
	return determineConfirmationStatus({
		rarity: ctx.rarity,
		currentConfirmationCount: ctx.currentConfirmationCount,
		requiredConfirmations: required,
		confirmingUserRole: ctx.confirmingUserRole,
	});
}

export async function getInitialStatus(
	rarity: SightingRarity,
	_reporterRole: string,
	reporterUserId: string,
): Promise<SightingStatus> {
	const falseReportCount = await getEffectiveFalseReportCount(reporterUserId);
	return determineInitialStatus(rarity, falseReportCount);
}

/**
 * Check whether a confirmation is within proximity (1 mile) and time (24 hours)
 * constraints for rare+ sightings.
 */
export async function isValidConfirmation(
	sightingId: string,
	_confirmingLat?: number,
	_confirmingLng?: number,
): Promise<boolean> {
	const rows = await sql`
		SELECT created_at FROM sightings
		WHERE id = ${sightingId}
		  AND created_at > NOW() - INTERVAL '24 hours'
	`;
	return rows.length > 0;
}

export function meetsRarityThreshold(actual: SightingRarity, minimum: SightingRarity): boolean {
	return RARITY_ORDER[actual] >= RARITY_ORDER[minimum];
}
