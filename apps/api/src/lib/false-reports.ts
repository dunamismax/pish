import { sql } from "./db";

const QUARTER_MONTHS = 3;

export interface FalseReportDecayResult {
	count: number;
	lastDecayAt: Date;
	quartersElapsed: number;
}

export function addMonths(date: Date, months: number): Date {
	const result = new Date(date);
	const originalDay = result.getUTCDate();

	result.setUTCDate(1);
	result.setUTCMonth(result.getUTCMonth() + months);

	const lastDayOfMonth = new Date(
		Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
	).getUTCDate();
	result.setUTCDate(Math.min(originalDay, lastDayOfMonth));

	return result;
}

export function countElapsedQuarters(lastDecayAt: Date, now = new Date()): number {
	if (lastDecayAt >= now) {
		return 0;
	}

	let quarters = 0;
	let cursor = new Date(lastDecayAt);

	while (true) {
		const next = addMonths(cursor, QUARTER_MONTHS);
		if (next > now) {
			break;
		}
		quarters += 1;
		cursor = next;
	}

	return quarters;
}

export function decayFalseReportCount(
	currentCount: number,
	lastDecayAt: Date,
	now = new Date(),
): FalseReportDecayResult {
	const quartersElapsed = countElapsedQuarters(lastDecayAt, now);

	if (quartersElapsed === 0) {
		return {
			count: currentCount,
			lastDecayAt,
			quartersElapsed,
		};
	}

	return {
		count: Math.max(0, currentCount - quartersElapsed),
		lastDecayAt: addMonths(lastDecayAt, quartersElapsed * QUARTER_MONTHS),
		quartersElapsed,
	};
}

async function getFalseReportState(userId: string): Promise<{ count: number; lastDecayAt: Date }> {
	const rows = await sql`
		SELECT false_report_count, last_false_report_decay_at
		FROM users
		WHERE id = ${userId}
		LIMIT 1
	`;

	if (rows.length === 0) {
		return {
			count: 0,
			lastDecayAt: new Date(),
		};
	}

	return {
		count: Number(rows[0].false_report_count ?? 0),
		lastDecayAt: new Date(rows[0].last_false_report_decay_at as string | Date),
	};
}

export async function getEffectiveFalseReportCount(
	userId: string,
	now = new Date(),
): Promise<number> {
	const state = await getFalseReportState(userId);
	const next = decayFalseReportCount(state.count, state.lastDecayAt, now);

	if (next.quartersElapsed > 0) {
		await sql`
			UPDATE users
			SET false_report_count = ${next.count},
				last_false_report_decay_at = ${next.lastDecayAt.toISOString()}
			WHERE id = ${userId}
		`;
	}

	return next.count;
}

export async function incrementFalseReportCount(userId: string, now = new Date()): Promise<number> {
	const state = await getFalseReportState(userId);
	const next = decayFalseReportCount(state.count, state.lastDecayAt, now);
	const incrementedCount = next.count + 1;

	await sql`
		UPDATE users
		SET false_report_count = ${incrementedCount},
			last_false_report_decay_at = ${next.lastDecayAt.toISOString()}
		WHERE id = ${userId}
	`;

	return incrementedCount;
}

export function determineModerationStatus(
	sightingFlagCount: number,
	falseReportCount: number,
): "unconfirmed" | "flagged" | "removed" {
	if (sightingFlagCount >= 5 || falseReportCount >= 10) {
		return "removed";
	}

	if (sightingFlagCount >= 3 || falseReportCount >= 5) {
		return "flagged";
	}

	return "unconfirmed";
}
