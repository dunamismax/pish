<script setup lang="ts">
import { ref, onMounted } from "vue";
import FrequencyChartD3 from "./FrequencyChartD3.vue";
import SpeciesRangeMap from "./SpeciesRangeMap.vue";

const props = defineProps<{
	speciesId: string;
	speciesCode: string;
	commonName: string;
	scientificName: string;
	familyCommonName: string | null;
	familyScientificName: string | null;
	order: string | null;
	category: string | null;
}>();

interface CommunityPhoto {
	sightingId: string;
	photoUrls: string[];
	lat: number;
	lng: number;
	locationName: string | null;
	observerUsername: string | null;
	createdAt: string;
}

interface CommunityAudio {
	sightingId: string;
	audioUrl: string;
	locationName: string | null;
	observerUsername: string | null;
	createdAt: string;
}

interface SimilarSpecies {
	id: string;
	speciesCode: string;
	commonName: string;
	scientificName: string;
}

interface SightingLocation {
	lat: number;
	lng: number;
	rarity: string;
	status: string;
	createdAt: string;
}

interface PersonalHistory {
	totalSightings: number;
	firstSighting: {
		id: string;
		locationName: string | null;
		createdAt: string;
	};
	userPhotos: string[];
}

const communityPhotos = ref<CommunityPhoto[]>([]);
const communityAudio = ref<CommunityAudio[]>([]);
const similarSpecies = ref<SimilarSpecies[]>([]);
const sightingLocations = ref<SightingLocation[]>([]);
const totalSightings = ref(0);
const personalHistory = ref<PersonalHistory | null>(null);
const isLoading = ref(true);
const error = ref(false);
const selectedPhoto = ref<string | null>(null);

// Flatten community photos into individual URLs for gallery
const allPhotos = ref<{ url: string; observer: string | null; date: string }[]>([]);

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function formatShortDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
}

// Generate habitat description from taxonomy
function getHabitatHint(): string {
	const family = props.familyCommonName?.toLowerCase() ?? "";
	const order = props.order?.toLowerCase() ?? "";

	if (family.includes("duck") || family.includes("goose") || family.includes("swan")) {
		return "Wetlands, lakes, ponds, rivers, and coastal marshes. Often seen on open water or grazing near shorelines.";
	}
	if (family.includes("hawk") || family.includes("eagle") || family.includes("kite")) {
		return "Open country, forest edges, and along waterways. Often seen soaring overhead or perched in tall trees.";
	}
	if (family.includes("sandpiper") || family.includes("plover")) {
		return "Shorelines, mudflats, and shallow wetlands. Found along beaches, tidal flats, and lake margins during migration.";
	}
	if (family.includes("warbler")) {
		return "Forest canopy and understory, thickets, and brushy areas. Active foragers often found in mixed flocks during migration.";
	}
	if (family.includes("sparrow") || family.includes("bunting") || family.includes("towhee")) {
		return "Brushy fields, grasslands, forest edges, and suburban gardens. Often found foraging on or near the ground.";
	}
	if (family.includes("heron") || family.includes("egret") || family.includes("bittern")) {
		return "Marshes, swamps, lake shores, and tidal flats. Wading birds that hunt fish and invertebrates in shallow water.";
	}
	if (family.includes("gull") || family.includes("tern")) {
		return "Coastlines, beaches, harbors, lakes, and rivers. Often seen flying over water or resting on shorelines.";
	}
	if (family.includes("woodpecker") || family.includes("flicker") || family.includes("sapsucker")) {
		return "Forests, woodlands, parks, and suburban areas with mature trees. Found on trunks and large branches.";
	}
	if (family.includes("owl")) {
		return "Forests, grasslands, deserts, and suburban areas depending on species. Primarily nocturnal or crepuscular hunters.";
	}
	if (family.includes("hummingbird")) {
		return "Gardens, forest edges, and flowering meadows. Attracted to nectar-producing flowers and feeders.";
	}
	if (family.includes("wren")) {
		return "Dense brush, thickets, rocky areas, and suburban gardens. Active and vocal, often staying low in vegetation.";
	}
	if (family.includes("flycatcher") || family.includes("kingbird") || family.includes("phoebe")) {
		return "Open woodland, forest clearings, and edges near water. Hunts insects from exposed perches with sallying flights.";
	}
	if (order.includes("passeriformes")) {
		return "Variable habitat depending on species. Perching birds found in forests, grasslands, wetlands, and urban areas.";
	}
	return "Habitat varies by region and season. Check eBird for detailed range and habitat information for this species.";
}

function getFieldMarksHint(): string {
	return "Community-contributed field mark descriptions are coming soon. For detailed identification guidance, consult your preferred field guide or the Cornell Lab's All About Birds.";
}

onMounted(async () => {
	try {
		const res = await fetch(`/api/species/${props.speciesId}/profile`);
		const json = await res.json();
		if (json.ok) {
			const d = json.data;
			communityPhotos.value = d.communityPhotos;
			communityAudio.value = d.communityAudio;
			similarSpecies.value = d.similarSpecies;
			sightingLocations.value = d.sightingLocations;
			totalSightings.value = d.totalSightings;
			personalHistory.value = d.personalHistory;

			// Flatten photos for gallery
			const photos: { url: string; observer: string | null; date: string }[] = [];
			for (const p of d.communityPhotos) {
				for (const url of p.photoUrls) {
					photos.push({ url, observer: p.observerUsername, date: p.createdAt });
				}
			}
			allPhotos.value = photos;
		} else {
			error.value = true;
		}
	} catch {
		error.value = true;
	} finally {
		isLoading.value = false;
	}
});
</script>

<template>
	<div class="space-y-6">
		<!-- Loading state -->
		<div v-if="isLoading" class="flex h-48 items-center justify-center">
			<div
				class="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-primary-600)] border-t-transparent"
			/>
		</div>

		<template v-else>
			<!-- Personal History (shown first if user has sightings of this species) -->
			<div
				v-if="personalHistory"
				class="rounded-xl border border-[var(--color-primary-200)] bg-[var(--color-primary-50)] p-5"
			>
				<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-primary-700)]">
					Your History
				</h2>
				<div class="flex flex-wrap gap-6">
					<div>
						<p class="text-2xl font-bold text-[var(--color-primary-700)]">
							{{ personalHistory.totalSightings }}
						</p>
						<p class="text-xs text-[var(--color-primary-600)]">
							{{ personalHistory.totalSightings === 1 ? "sighting" : "sightings" }}
						</p>
					</div>
					<div>
						<p class="text-sm font-medium text-[var(--color-primary-700)]">
							First seen {{ formatDate(personalHistory.firstSighting.createdAt) }}
						</p>
						<p v-if="personalHistory.firstSighting.locationName" class="text-xs text-[var(--color-primary-600)]">
							{{ personalHistory.firstSighting.locationName }}
						</p>
					</div>
				</div>
				<!-- User's own photos -->
				<div v-if="personalHistory.userPhotos.length > 0" class="mt-4">
					<p class="mb-2 text-xs font-medium text-[var(--color-primary-600)]">Your photos</p>
					<div class="flex gap-2 overflow-x-auto pb-1">
						<button
							v-for="(url, i) in personalHistory.userPhotos.slice(0, 8)"
							:key="i"
							class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg"
							@click="selectedPhoto = url"
						>
							<img :src="url" alt="" class="h-full w-full object-cover" loading="lazy" />
						</button>
					</div>
				</div>
			</div>

			<!-- Community Photos -->
			<div class="rounded-xl border border-[var(--color-border)] p-5">
				<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
					Photos
				</h2>
				<div v-if="allPhotos.length === 0" class="py-6 text-center">
					<svg
						class="mx-auto h-8 w-8 text-[var(--color-text-muted)]"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
						/>
					</svg>
					<p class="mt-2 text-sm text-[var(--color-text-muted)]">
						No community photos yet. Be the first to add one with a sighting report!
					</p>
				</div>
				<div v-else class="grid grid-cols-3 gap-2 sm:grid-cols-4">
					<button
						v-for="(photo, i) in allPhotos.slice(0, 12)"
						:key="i"
						class="group relative aspect-square overflow-hidden rounded-lg"
						@click="selectedPhoto = photo.url"
					>
						<img
							:src="photo.url"
							alt=""
							class="h-full w-full object-cover transition-transform group-hover:scale-105"
							loading="lazy"
						/>
						<div
							class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1 opacity-0 transition-opacity group-hover:opacity-100"
						>
							<p class="truncate text-[10px] text-white">
								{{ photo.observer ?? "Anonymous" }}
							</p>
						</div>
					</button>
				</div>
			</div>

			<!-- Audio Recordings -->
			<div v-if="communityAudio.length > 0" class="rounded-xl border border-[var(--color-border)] p-5">
				<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
					Audio Recordings
				</h2>
				<div class="space-y-3">
					<div
						v-for="recording in communityAudio"
						:key="recording.sightingId"
						class="flex items-center gap-3 rounded-lg bg-[var(--color-bg-alt)] p-3"
					>
						<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-100)]">
							<svg class="h-5 w-5 text-[var(--color-primary-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
							</svg>
						</div>
						<div class="min-w-0 flex-1">
							<audio controls preload="none" class="w-full h-8">
								<source :src="recording.audioUrl" />
							</audio>
							<p class="mt-1 truncate text-xs text-[var(--color-text-muted)]">
								{{ recording.observerUsername ?? "Anonymous" }}
								<span v-if="recording.locationName"> &middot; {{ recording.locationName }}</span>
								&middot; {{ formatShortDate(recording.createdAt) }}
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- D3 Frequency Chart -->
			<div class="rounded-xl border border-[var(--color-border)] p-5">
				<FrequencyChartD3 :species-id="speciesId" client:load />
			</div>

			<!-- Sighting Range Map -->
			<div class="rounded-xl border border-[var(--color-border)] p-5">
				<SpeciesRangeMap :locations="sightingLocations" />
			</div>

			<!-- Habitat -->
			<div class="rounded-xl border border-[var(--color-border)] p-5">
				<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
					Habitat
				</h2>
				<p class="text-sm leading-relaxed text-[var(--color-text)]">
					{{ getHabitatHint() }}
				</p>
			</div>

			<!-- Field Marks -->
			<div class="rounded-xl border border-[var(--color-border)] p-5">
				<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
					Field Marks
				</h2>
				<p class="text-sm leading-relaxed text-[var(--color-text-muted)]">
					{{ getFieldMarksHint() }}
				</p>
			</div>

			<!-- Similar Species -->
			<div v-if="similarSpecies.length > 0" class="rounded-xl border border-[var(--color-border)] p-5">
				<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
					Similar Species
					<span class="ml-1 text-xs font-normal normal-case">(same family)</span>
				</h2>
				<div class="grid gap-2 sm:grid-cols-2">
					<a
						v-for="sp in similarSpecies"
						:key="sp.id"
						:href="`/app/field-guide/${sp.id}`"
						class="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-[var(--color-bg-alt)]"
					>
						<div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-50)]">
							<svg class="h-4 w-4 text-[var(--color-primary-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
							</svg>
						</div>
						<div class="min-w-0">
							<p class="truncate text-sm font-medium">{{ sp.commonName }}</p>
							<p class="truncate text-xs italic text-[var(--color-text-muted)]">{{ sp.scientificName }}</p>
						</div>
					</a>
				</div>
			</div>

			<!-- Community Stats -->
			<div class="rounded-xl border border-[var(--color-border)] p-5">
				<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
					Community Stats
				</h2>
				<div class="flex flex-wrap gap-6">
					<div>
						<p class="text-2xl font-bold">{{ totalSightings }}</p>
						<p class="text-xs text-[var(--color-text-muted)]">total sightings</p>
					</div>
					<div>
						<p class="text-2xl font-bold">{{ allPhotos.length }}</p>
						<p class="text-xs text-[var(--color-text-muted)]">photos</p>
					</div>
					<div>
						<p class="text-2xl font-bold">{{ communityAudio.length }}</p>
						<p class="text-xs text-[var(--color-text-muted)]">recordings</p>
					</div>
				</div>
			</div>

			<!-- eBird link -->
			<div class="text-center">
				<a
					:href="`https://ebird.org/species/${speciesCode}`"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-1.5 text-sm text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]"
				>
					View on eBird
					<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
					</svg>
				</a>
			</div>
		</template>

		<!-- Photo lightbox overlay -->
		<Teleport to="body">
			<div
				v-if="selectedPhoto"
				class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
				@click.self="selectedPhoto = null"
			>
				<button
					class="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
					@click="selectedPhoto = null"
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
				<img
					:src="selectedPhoto"
					alt=""
					class="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
				/>
			</div>
		</Teleport>
	</div>
</template>
