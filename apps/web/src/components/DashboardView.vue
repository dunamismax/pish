<script setup lang="ts">
import { ref, onMounted } from "vue";

interface NearbySighting {
	id: string;
	lat: number;
	lng: number;
	rarity: string;
	status: string;
	createdAt: string;
	species: {
		commonName: string;
		scientificName: string;
		speciesCode: string;
	};
	observerUsername: string | null;
	distanceKm: number;
}

interface SpeciesAlert {
	id: string;
	species: {
		commonName: string;
		speciesCode: string;
	};
	minRarity: string;
	radiusKm: number;
	active: boolean;
}

const recentSightings = ref<NearbySighting[]>([]);
const alerts = ref<SpeciesAlert[]>([]);
const isLoading = ref(true);
const locationAvailable = ref(false);

const RARITY_COLORS: Record<string, string> = {
	common: "#22c55e",
	uncommon: "#eab308",
	rare: "#f97316",
	mega_rare: "#ef4444",
};

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
}

function rarityLabel(r: string): string {
	return r === "mega_rare" ? "Mega Rare" : r.charAt(0).toUpperCase() + r.slice(1);
}

onMounted(async () => {
	try {
		// Try to get location for nearby sightings
		const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
			navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
		});

		locationAvailable.value = true;
		const { latitude: lat, longitude: lng } = pos.coords;

		const [sightingsRes, alertsRes] = await Promise.all([
			fetch(`/api/sightings/nearby?lat=${lat}&lng=${lng}&radiusKm=25&limit=10`),
			fetch("/api/alerts/species"),
		]);

		const sightingsJson = await sightingsRes.json();
		if (sightingsJson.ok) {
			recentSightings.value = sightingsJson.data;
		}

		const alertsJson = await alertsRes.json();
		if (alertsJson.ok) {
			alerts.value = alertsJson.data;
		}
	} catch {
		// No location or fetch error
		try {
			const alertsRes = await fetch("/api/alerts/species");
			const alertsJson = await alertsRes.json();
			if (alertsJson.ok) {
				alerts.value = alertsJson.data;
			}
		} catch {
			// Silent fail
		}
	} finally {
		isLoading.value = false;
	}
});
</script>

<template>
	<div class="space-y-8">
		<!-- Welcome section -->
		<div class="rounded-xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-primary-50)] to-[var(--color-bg)] p-6">
			<h2 class="text-xl font-bold">Welcome back</h2>
			<p class="mt-1 text-sm text-[var(--color-text-muted)]">
				Here's what's happening in birding near you.
			</p>
			<div class="mt-4 flex flex-wrap gap-3">
				<a href="/app/map" class="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-700)] transition-colors">
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
					</svg>
					Open Map
				</a>
				<a href="/app/field-guide" class="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-bg-alt)] transition-colors">
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
					</svg>
					Field Guide
				</a>
			</div>
		</div>

		<!-- Loading state -->
		<div v-if="isLoading" class="flex h-32 items-center justify-center">
			<div class="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-primary-600)] border-t-transparent" />
		</div>

		<template v-else>
			<!-- Nearby sightings -->
			<div>
				<div class="mb-3 flex items-center justify-between">
					<h3 class="text-base font-semibold">Recent Sightings Nearby</h3>
					<a href="/app/map" class="text-xs text-[var(--color-primary-600)] hover:underline">View on map</a>
				</div>

				<div v-if="!locationAvailable" class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-6 text-center">
					<p class="text-sm text-[var(--color-text-muted)]">Enable location access to see nearby sightings.</p>
				</div>

				<div v-else-if="recentSightings.length === 0" class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-6 text-center">
					<p class="text-sm text-[var(--color-text-muted)]">No recent sightings nearby. Be the first to report one!</p>
				</div>

				<ul v-else class="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)]">
					<li v-for="s in recentSightings" :key="s.id" class="flex items-center gap-3 px-4 py-3">
						<span
							class="h-3 w-3 flex-shrink-0 rounded-full"
							:style="{ backgroundColor: RARITY_COLORS[s.rarity] }"
						/>
						<div class="min-w-0 flex-1">
							<p class="text-sm font-medium truncate">{{ s.species.commonName }}</p>
							<p class="text-xs text-[var(--color-text-muted)]">
								{{ s.distanceKm }} km &middot; {{ formatDate(s.createdAt) }}
								<span v-if="s.observerUsername"> &middot; by {{ s.observerUsername }}</span>
							</p>
						</div>
						<span
							class="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
							:style="{ backgroundColor: RARITY_COLORS[s.rarity] }"
						>
							{{ rarityLabel(s.rarity) }}
						</span>
					</li>
				</ul>
			</div>

			<!-- Active alerts -->
			<div>
				<div class="mb-3 flex items-center justify-between">
					<h3 class="text-base font-semibold">Your Alert Matches</h3>
					<a href="/app/profile" class="text-xs text-[var(--color-primary-600)] hover:underline">Manage alerts</a>
				</div>

				<div v-if="alerts.length === 0" class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-6 text-center">
					<p class="text-sm text-[var(--color-text-muted)]">No species alerts set up. Track rare species from your profile.</p>
				</div>

				<ul v-else class="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)]">
					<li v-for="a in alerts" :key="a.id" class="flex items-center justify-between px-4 py-3">
						<div>
							<p class="text-sm font-medium">{{ a.species.commonName }}</p>
							<p class="text-xs text-[var(--color-text-muted)]">
								{{ rarityLabel(a.minRarity) }}+ within {{ a.radiusKm }} km
							</p>
						</div>
						<span
							:class="[
								'rounded-full px-2 py-0.5 text-[10px] font-medium',
								a.active
									? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
									: 'bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)]',
							]"
						>
							{{ a.active ? "Active" : "Paused" }}
						</span>
					</li>
				</ul>
			</div>
		</template>
	</div>
</template>
