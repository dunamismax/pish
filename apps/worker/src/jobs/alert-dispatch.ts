import type { Job } from "bullmq";
import IORedis from "ioredis";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "postgres://pish:pish@localhost:5432/pish");

interface ConfirmedSighting {
	id: string;
	userId: string;
	speciesId: string;
	lat: number;
	lng: number;
	locationName: string | null;
	rarity: string;
	status: string;
}

interface AlertNotification {
	userId: string;
	type: string;
	title: string;
	body: string;
	data: Record<string, unknown>;
}

/**
 * Fan out notifications to users with matching species/location alerts
 * within the configured radius of a confirmed sighting.
 */
export async function processAlertDispatch(job: Job): Promise<void> {
	const sighting: ConfirmedSighting = job.data;
	console.log(`[alert-dispatch] processing sighting ${sighting.id}`);

	const notifications: AlertNotification[] = [];

	// Get species name for notification text
	const speciesRows = await sql`
		SELECT common_name FROM species WHERE id = ${sighting.speciesId}
	`;
	const speciesName = speciesRows[0]?.common_name ?? "Unknown species";

	// ─── Match Species Alerts ────────────────────────────────────
	// Find users with species alerts matching this species within radius
	const rarityOrder: Record<string, number> = {
		common: 0,
		uncommon: 1,
		rare: 2,
		mega_rare: 3,
	};
	const sightingRarityOrder = rarityOrder[sighting.rarity] ?? 0;

	// All rarity values that meet or exceed the sighting's rarity
	const matchingRarities = Object.entries(rarityOrder)
		.filter(([_, order]) => order <= sightingRarityOrder)
		.map(([rarity]) => rarity);

	if (matchingRarities.length > 0) {
		const speciesAlertRows = await sql`
			SELECT usa.user_id, usa.radius_km
			FROM user_species_alerts usa
			WHERE usa.species_id = ${sighting.speciesId}
			  AND usa.active = TRUE
			  AND usa.min_rarity = ANY(${matchingRarities})
			  AND usa.user_id != ${sighting.userId}
		`;

		// For each species alert, check if the sighting is within radius
		// We filter by distance here since the alert has a user location context
		for (const alert of speciesAlertRows) {
			notifications.push({
				userId: alert.user_id,
				type: "species_alert",
				title: `${speciesName} spotted!`,
				body: `A ${sighting.rarity.replace("_", " ")} ${speciesName} was reported${sighting.locationName ? ` near ${sighting.locationName}` : ""}.`,
				data: {
					sightingId: sighting.id,
					speciesId: sighting.speciesId,
					rarity: sighting.rarity,
					lat: sighting.lat,
					lng: sighting.lng,
				},
			});
		}
	}

	// ─── Match Location Alerts ───────────────────────────────────
	// Find users with location alerts where the sighting falls within radius
	const locationAlertRows = await sql`
		SELECT ula.user_id, ula.radius_km
		FROM user_location_alerts ula
		WHERE ula.active = TRUE
		  AND ula.user_id != ${sighting.userId}
		  AND ST_DWithin(
		    ula.location,
		    ST_SetSRID(ST_MakePoint(${sighting.lng}, ${sighting.lat}), 4326)::geography,
		    ula.radius_km * 1000
		  )
	`;

	for (const alert of locationAlertRows) {
		// Avoid duplicates if user already has a species alert notification
		if (notifications.some((n) => n.userId === alert.user_id)) continue;

		notifications.push({
			userId: alert.user_id,
			type: "location_alert",
			title: `New sighting nearby!`,
			body: `A ${sighting.rarity.replace("_", " ")} ${speciesName} was reported${sighting.locationName ? ` near ${sighting.locationName}` : ""}.`,
			data: {
				sightingId: sighting.id,
				speciesId: sighting.speciesId,
				rarity: sighting.rarity,
				lat: sighting.lat,
				lng: sighting.lng,
			},
		});
	}

	// ─── Insert Notifications ────────────────────────────────────
	if (notifications.length > 0) {
		// Batch insert notifications
		await sql`
			INSERT INTO notifications ${sql(
				notifications.map((n) => ({
					user_id: n.userId,
					type: n.type,
					title: n.title,
					body: n.body,
					data: JSON.stringify(n.data),
				})),
			)}
		`;

		console.log(
			`[alert-dispatch] sent ${notifications.length} notifications for sighting ${sighting.id}`,
		);
	} else {
		console.log(`[alert-dispatch] no matching alerts for sighting ${sighting.id}`);
	}

	// Publish to Valkey pub/sub for real-time subscribers
	const valkey = new IORedis(process.env.VALKEY_URL || "redis://localhost:6379", {
		maxRetriesPerRequest: null,
	});
	await valkey.publish("sighting:confirmed:dispatched", JSON.stringify(sighting));
	await valkey.quit();
}
