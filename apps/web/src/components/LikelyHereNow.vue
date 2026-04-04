<script setup lang="ts">
import { ref, onMounted } from "vue";

interface LikelySpecies {
	id: string;
	speciesCode: string;
	commonName: string;
	scientificName: string;
	familyCommonName: string | null;
	frequency: number;
	sampleSize: number | null;
}

interface LikelyMeta {
	month: number;
	regionCode: string;
	lat: number;
	lng: number;
}

const species = ref<LikelySpecies[]>([]);
const meta = ref<LikelyMeta | null>(null);
const isLoading = ref(true);
const locationError = ref(false);

const MONTH_NAMES = [
	"January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December",
];

function formatPct(f: number): string {
	return `${(f * 100).toFixed(1)}%`;
}

onMounted(async () => {
	try {
		const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
			navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
		});

		const { latitude: lat, longitude: lng } = pos.coords;
		const res = await fetch(`/api/species/likely-here?lat=${lat}&lng=${lng}&limit=20`);
		const json = await res.json();
		if (json.ok) {
			species.value = json.data;
			meta.value = json.meta;
		}
	} catch {
		locationError.value = true;
	} finally {
		isLoading.value = false;
	}
});
</script>

<template>
	<div>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-lg font-semibold">Likely Here Now</h2>
			<span v-if="meta" class="text-xs text-[var(--color-text-muted)]">
				{{ MONTH_NAMES[meta.month - 1] }} &middot; {{ meta.regionCode }}
			</span>
		</div>

		<div v-if="isLoading" class="flex h-40 items-center justify-center">
			<div class="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-primary-600)] border-t-transparent" />
		</div>

		<div v-else-if="locationError" class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-6 text-center">
			<p class="text-sm text-[var(--color-text-muted)]">Enable location access to see species likely in your area.</p>
		</div>

		<div v-else-if="species.length === 0" class="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-6 text-center">
			<p class="text-sm text-[var(--color-text-muted)]">No frequency data available for your region.</p>
		</div>

		<ul v-else class="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)]">
			<li
				v-for="s in species"
				:key="s.id"
				class="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-bg-alt)] transition-colors"
			>
				<a :href="`/app/field-guide/${s.id}`" class="flex flex-1 items-center gap-3 min-w-0">
					<div class="min-w-0 flex-1">
						<p class="text-sm font-medium truncate">{{ s.commonName }}</p>
						<p class="text-xs text-[var(--color-text-muted)] italic truncate">{{ s.scientificName }}</p>
					</div>
					<div class="flex-shrink-0 text-right">
						<p class="text-sm font-medium text-[var(--color-primary-600)]">{{ formatPct(s.frequency) }}</p>
						<p v-if="s.familyCommonName" class="text-[10px] text-[var(--color-text-muted)]">{{ s.familyCommonName }}</p>
					</div>
				</a>
			</li>
		</ul>
	</div>
</template>
