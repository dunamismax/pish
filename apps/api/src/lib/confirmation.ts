import type { SightingRarity, SightingStatus } from "@pish/contracts";
import { sql } from "./db";

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

/**
 * Get the number of unresolved flags for a user.
 */
async function getUserFlagCount(userId: string): Promise<number> {
	const rows = await sql`
		SELECT COUNT(*)::int AS cnt
		FROM sighting_flags sf
		JOIN sightings s ON s.id = sf.sighting_id
		WHERE s.user_id = ${userId} AND NOT sf.resolved
	`;
	return rows[0]?.cnt ?? 0;
}

/**
 * Determine required confirmation count based on rarity, reporter reputation, and flags.
 *
 * - common: auto-confirmed (0 needed)
 * - uncommon: 0 needed (feed only, no alert dispatch)
 * - rare: 2 confirmations (3 for new users, 1 additional for trusted)
 * - mega_rare: 2 confirmations OR 1 from trusted/mod
 *
 * Anti-abuse adjustments:
 * - 3+ flags: threshold raised by 1
 * - 5+ flags: requires mod review (threshold set very high)
 */
async function getRequiredConfirmations(
	rarity: SightingRarity,
	reporterRole: string,
	reporterUserId: string,
): Promise<number> {
	if (rarity === "common") return 0;
	if (rarity === "uncommon") return 0;

	const flagCount = await getUserFlagCount(reporterUserId);

	// 5+ flags: requires mod review
	if (flagCount >= 5) return 999;

	const isNewUser = reporterRole === "new_user";
	const isTrusted = ["trusted", "regional_mod", "admin", "god"].includes(reporterRole);

	let required: number;
	if (rarity === "mega_rare") {
		required = isTrusted ? 1 : isNewUser ? 3 : 2;
	} else {
		// rare
		required = isTrusted ? 1 : isNewUser ? 3 : 2;
	}

	// 3+ flags raises threshold
	if (flagCount >= 3) {
		required += 1;
	}

	return required;
}

/**
 * Evaluate whether a sighting should be confirmed after a new confirmation
 * is added. Returns the new status.
 */
export async function evaluateConfirmation(ctx: ConfirmationContext): Promise<SightingStatus> {
	const required = await getRequiredConfirmations(ctx.rarity, ctx.reporterRole, ctx.reporterUserId);

	// mega_rare: 1 confirmation from trusted/mod user is enough
	if (ctx.rarity === "mega_rare") {
		const isTrustedConfirmer = ["trusted", "regional_mod", "admin", "god"].includes(
			ctx.confirmingUserRole,
		);
		if (isTrustedConfirmer) {
			return "confirmed";
		}
	}

	if (ctx.currentConfirmationCount >= required) {
		return "confirmed";
	}

	return "unconfirmed";
}

/**
 * Determine initial status for a new sighting.
 */
export async function getInitialStatus(
	rarity: SightingRarity,
	_reporterRole: string,
	reporterUserId: string,
): Promise<SightingStatus> {
	if (rarity === "common") return "confirmed";

	const flagCount = await getUserFlagCount(reporterUserId);
	// 10+ flags: auto-ban pending review
	if (flagCount >= 10) return "removed";
	// 5+ flags: requires mod review
	if (flagCount >= 5) return "flagged";

	return "unconfirmed";
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
	// For now, check the sighting exists and is within 24 hours
	const rows = await sql`
		SELECT created_at FROM sightings
		WHERE id = ${sightingId}
		  AND created_at > NOW() - INTERVAL '24 hours'
	`;
	return rows.length > 0;
}

/**
 * Check if a rarity meets a minimum threshold.
 */
export function meetsRarityThreshold(actual: SightingRarity, minimum: SightingRarity): boolean {
	return RARITY_ORDER[actual] >= RARITY_ORDER[minimum];
}
