<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import maplibregl from "maplibre-gl";

// ─── Types ───────────────────────────────────────────────────────
interface NearbySighting {
	id: string;
	lat: number;
	lng: number;
	rarity: "common" | "uncommon" | "rare" | "mega_rare";
	status: "unconfirmed" | "confirmed" | "flagged" | "removed";
	confirmationCount: number;
	photoUrls: string[];
	createdAt: string;
	species: {
		commonName: string;
		scientificName: string;
		speciesCode: string;
	};
	observerUsername: string | null;
	distanceKm: number;
}

interface NearbyHotspot {
	id: string;
	name: string;
	lat: number;
	lng: number;
	speciesCount: number | null;
	distanceKm: number;
}

// ─── Constants ───────────────────────────────────────────────────
const RARITY_COLORS: Record<string, string> = {
	common: "#22c55e",
	uncommon: "#eab308",
	rare: "#f97316",
	mega_rare: "#ef4444",
};

const API_BASE = "/api";

// ─── State ───────────────────────────────────────────────────────
const mapContainer = ref<HTMLDivElement>();
const map = ref<maplibregl.Map>();
const userPosition = ref<{ lat: number; lng: number } | null>(null);
const sightings = ref<NearbySighting[]>([]);
const hotspots = ref<NearbyHotspot[]>([]);
const selectedSighting = ref<NearbySighting | null>(null);
const selectedHotspot = ref<NearbyHotspot | null>(null);
const isLoading = ref(true);
const radiusKm = ref(25);
const activeLayer = ref<"sightings" | "hotspots" | "heatmap">("sightings");
const nearMeOpen = ref(false);

const nearMeSightings = computed(() => {
	return sightings.value.slice(0, 10);
});

// ─── Data Fetching ───────────────────────────────────────────────
async function fetchNearbySightings(lat: number, lng: number) {
	try {
		const res = await fetch(
			`${API_BASE}/sightings/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm.value}&limit=100`,
		);
		const json = await res.json();
		if (json.ok) {
			sightings.value = json.data;
		}
	} catch {
		// Silently fail - map still renders
	}
}

async function fetchNearbyHotspots(lat: number, lng: number) {
	try {
		const res = await fetch(
			`${API_BASE}/hotspots/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm.value}&limit=50`,
		);
		const json = await res.json();
		if (json.ok) {
			hotspots.value = json.data;
		}
	} catch {
		// Silently fail
	}
}

async function loadData(lat: number, lng: number) {
	isLoading.value = true;
	await Promise.all([fetchNearbySightings(lat, lng), fetchNearbyHotspots(lat, lng)]);
	isLoading.value = false;
	updateMapLayers();
}

// ─── Map Layers ──────────────────────────────────────────────────
function updateMapLayers() {
	const m = map.value;
	if (!m) return;

	// Remove existing sources and layers
	for (const id of ["sightings-confirmed", "sightings-unconfirmed", "hotspots-layer", "heatmap-layer"]) {
		if (m.getLayer(id)) m.removeLayer(id);
	}
	for (const id of ["sightings-source", "hotspots-source"]) {
		if (m.getSource(id)) m.removeSource(id);
	}

	// Sightings source
	const sightingFeatures = sightings.value.map((s) => ({
		type: "Feature" as const,
		geometry: {
			type: "Point" as const,
			coordinates: [s.lng, s.lat],
		},
		properties: {
			id: s.id,
			rarity: s.rarity,
			status: s.status,
			commonName: s.species.commonName,
			color: RARITY_COLORS[s.rarity] || "#22c55e",
			confirmed: s.status === "confirmed" ? 1 : 0,
		},
	}));

	m.addSource("sightings-source", {
		type: "geojson",
		data: { type: "FeatureCollection", features: sightingFeatures },
	});

	// Hotspots source
	const hotspotFeatures = hotspots.value.map((h) => ({
		type: "Feature" as const,
		geometry: {
			type: "Point" as const,
			coordinates: [h.lng, h.lat],
		},
		properties: {
			id: h.id,
			name: h.name,
			speciesCount: h.speciesCount ?? 0,
		},
	}));

	m.addSource("hotspots-source", {
		type: "geojson",
		data: { type: "FeatureCollection", features: hotspotFeatures },
	});

	if (activeLayer.value === "sightings" || activeLayer.value === "heatmap") {
		// Confirmed sightings (solid circles)
		m.addLayer({
			id: "sightings-confirmed",
			type: "circle",
			source: "sightings-source",
			filter: ["==", ["get", "confirmed"], 1],
			paint: {
				"circle-radius": 8,
				"circle-color": ["get", "color"],
				"circle-opacity": 0.9,
				"circle-stroke-width": 2,
				"circle-stroke-color": "#ffffff",
			},
			layout: {
				visibility: activeLayer.value === "sightings" ? "visible" : "none",
			},
		});

		// Unconfirmed sightings (hollow circles)
		m.addLayer({
			id: "sightings-unconfirmed",
			type: "circle",
			source: "sightings-source",
			filter: ["==", ["get", "confirmed"], 0],
			paint: {
				"circle-radius": 8,
				"circle-color": "transparent",
				"circle-opacity": 1,
				"circle-stroke-width": 2.5,
				"circle-stroke-color": ["get", "color"],
			},
			layout: {
				visibility: activeLayer.value === "sightings" ? "visible" : "none",
			},
		});

		// Heatmap layer
		if (activeLayer.value === "heatmap") {
			m.addLayer({
				id: "heatmap-layer",
				type: "heatmap",
				source: "sightings-source",
				paint: {
					"heatmap-weight": 1,
					"heatmap-intensity": 1,
					"heatmap-radius": 30,
					"heatmap-color": [
						"interpolate",
						["linear"],
						["heatmap-density"],
						0, "rgba(0, 0, 0, 0)",
						0.2, "rgba(34, 197, 94, 0.3)",
						0.4, "rgba(234, 179, 8, 0.5)",
						0.6, "rgba(249, 115, 22, 0.7)",
						0.8, "rgba(239, 68, 68, 0.85)",
						1, "rgba(239, 68, 68, 1)",
					],
				},
			});
		}
	}

	if (activeLayer.value === "hotspots") {
		m.addLayer({
			id: "hotspots-layer",
			type: "circle",
			source: "hotspots-source",
			paint: {
				"circle-radius": [
					"interpolate", ["linear"], ["get", "speciesCount"],
					0, 6,
					100, 10,
					300, 14,
				],
				"circle-color": "#2563eb",
				"circle-opacity": 0.7,
				"circle-stroke-width": 2,
				"circle-stroke-color": "#ffffff",
			},
		});
	}
}

// ─── Click Handlers ──────────────────────────────────────────────
function setupClickHandlers(m: maplibregl.Map) {
	// Sighting click
	for (const layerId of ["sightings-confirmed", "sightings-unconfirmed"]) {
		m.on("click", layerId, (e) => {
			const feature = e.features?.[0];
			if (!feature) return;
			const id = feature.properties?.id;
			const found = sightings.value.find((s) => s.id === id);
			if (found) {
				selectedSighting.value = found;
				selectedHotspot.value = null;
			}
		});

		m.on("mouseenter", layerId, () => {
			m.getCanvas().style.cursor = "pointer";
		});
		m.on("mouseleave", layerId, () => {
			m.getCanvas().style.cursor = "";
		});
	}

	// Hotspot click
	m.on("click", "hotspots-layer", (e) => {
		const feature = e.features?.[0];
		if (!feature) return;
		const id = feature.properties?.id;
		const found = hotspots.value.find((h) => h.id === id);
		if (found) {
			selectedHotspot.value = found;
			selectedSighting.value = null;
		}
	});

	m.on("mouseenter", "hotspots-layer", () => {
		m.getCanvas().style.cursor = "pointer";
	});
	m.on("mouseleave", "hotspots-layer", () => {
		m.getCanvas().style.cursor = "";
	});
}

// ─── Geolocation ─────────────────────────────────────────────────
function getUserLocation(): Promise<{ lat: number; lng: number }> {
	return new Promise((resolve, reject) => {
		if (!navigator.geolocation) {
			reject(new Error("Geolocation not supported"));
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
			(err) => reject(err),
			{ enableHighAccuracy: true, timeout: 10000 },
		);
	});
}

function recenterOnUser() {
	if (userPosition.value && map.value) {
		map.value.flyTo({
			center: [userPosition.value.lng, userPosition.value.lat],
			zoom: 12,
		});
	}
}

// ─── Lifecycle ───────────────────────────────────────────────────
onMounted(async () => {
	if (!mapContainer.value) return;

	// Default to roughly continental US center
	let center: [number, number] = [-98.5795, 39.8283];
	let zoom = 4;

	try {
		const pos = await getUserLocation();
		userPosition.value = pos;
		center = [pos.lng, pos.lat];
		zoom = 12;
	} catch {
		// Fall back to default center
	}

	const m = new maplibregl.Map({
		container: mapContainer.value,
		style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
		center,
		zoom,
		attributionControl: false,
	});

	m.addControl(new maplibregl.NavigationControl(), "top-right");
	m.addControl(
		new maplibregl.AttributionControl({ compact: true }),
		"bottom-right",
	);

	map.value = m;

	m.on("load", () => {
		if (userPosition.value) {
			// Add user location marker
			new maplibregl.Marker({ color: "#2563eb" })
				.setLngLat([userPosition.value.lng, userPosition.value.lat])
				.addTo(m);

			loadData(userPosition.value.lat, userPosition.value.lng);
		} else {
			isLoading.value = false;
		}

		setupClickHandlers(m);
	});
});

onUnmounted(() => {
	map.value?.remove();
});

watch(activeLayer, () => {
	updateMapLayers();
});

watch(radiusKm, () => {
	if (userPosition.value) {
		loadData(userPosition.value.lat, userPosition.value.lng);
	}
});

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
</script>

<template>
	<div class="relative h-full w-full">
		<!-- Map container -->
		<div ref="mapContainer" class="absolute inset-0" />

		<!-- Loading overlay -->
		<div
			v-if="isLoading"
			class="absolute inset-0 z-10 flex items-center justify-center bg-[var(--color-bg)]/60"
		>
			<div class="flex items-center gap-3 rounded-xl bg-[var(--color-bg-elevated)] px-6 py-4 shadow-lg">
				<div class="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-primary-600)] border-t-transparent" />
				<span class="text-sm font-medium">Loading map data...</span>
			</div>
		</div>

		<!-- Layer toggle controls -->
		<div class="absolute left-3 top-3 z-20 flex gap-1 rounded-lg bg-[var(--color-bg-elevated)] p-1 shadow-md">
			<button
				v-for="layer in [
					{ id: 'sightings', label: 'Sightings' },
					{ id: 'hotspots', label: 'Hotspots' },
					{ id: 'heatmap', label: 'Heatmap' },
				]"
				:key="layer.id"
				:class="[
					'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
					activeLayer === layer.id
						? 'bg-[var(--color-primary-600)] text-white'
						: 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]',
				]"
				@click="activeLayer = layer.id as 'sightings' | 'hotspots' | 'heatmap'"
			>
				{{ layer.label }}
			</button>
		</div>

		<!-- Radius control -->
		<div class="absolute left-3 top-14 z-20 rounded-lg bg-[var(--color-bg-elevated)] px-3 py-2 shadow-md">
			<label class="flex items-center gap-2 text-xs">
				<span class="text-[var(--color-text-muted)]">Radius:</span>
				<select
					v-model="radiusKm"
					class="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-0.5 text-xs"
				>
					<option :value="5">5 km</option>
					<option :value="10">10 km</option>
					<option :value="25">25 km</option>
					<option :value="50">50 km</option>
					<option :value="100">100 km</option>
				</select>
			</label>
		</div>

		<!-- Recenter button -->
		<button
			v-if="userPosition"
			class="absolute bottom-24 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-bg-elevated)] shadow-md hover:bg-[var(--color-border)] md:bottom-6"
			title="Center on my location"
			@click="recenterOnUser"
		>
			<svg class="h-5 w-5 text-[var(--color-info)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06z" />
			</svg>
		</button>

		<!-- "What's near me" panel toggle -->
		<button
			v-if="sightings.length > 0"
			class="absolute bottom-24 left-3 z-20 flex items-center gap-2 rounded-lg bg-[var(--color-bg-elevated)] px-3 py-2 shadow-md hover:bg-[var(--color-border)] md:bottom-6"
			@click="nearMeOpen = !nearMeOpen"
		>
			<svg class="h-4 w-4 text-[var(--color-primary-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
				<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
			</svg>
			<span class="text-xs font-medium">Near me ({{ sightings.length }})</span>
		</button>

		<!-- "What's near me" slide-up panel -->
		<div
			v-if="nearMeOpen"
			class="absolute bottom-40 left-3 z-30 max-h-72 w-80 overflow-y-auto rounded-xl bg-[var(--color-bg-elevated)] shadow-xl md:bottom-16"
		>
			<div class="sticky top-0 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-3">
				<h3 class="text-sm font-semibold">Recent sightings near you</h3>
				<button class="text-[var(--color-text-muted)] hover:text-[var(--color-text)]" @click="nearMeOpen = false">
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<ul class="divide-y divide-[var(--color-border)]">
				<li
					v-for="s in nearMeSightings"
					:key="s.id"
					class="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-[var(--color-bg-alt)]"
					@click="selectedSighting = s; nearMeOpen = false"
				>
					<span
						class="mt-0.5 h-3 w-3 flex-shrink-0 rounded-full"
						:style="{ backgroundColor: RARITY_COLORS[s.rarity] }"
					/>
					<div class="min-w-0 flex-1">
						<p class="text-sm font-medium truncate">{{ s.species.commonName }}</p>
						<p class="text-xs text-[var(--color-text-muted)]">
							{{ s.distanceKm }} km away &middot; {{ formatDate(s.createdAt) }}
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

		<!-- Sighting detail panel -->
		<div
			v-if="selectedSighting"
			class="absolute bottom-20 right-3 z-30 w-80 rounded-xl bg-[var(--color-bg-elevated)] shadow-xl md:bottom-4"
		>
			<div class="flex items-start justify-between border-b border-[var(--color-border)] px-4 py-3">
				<div>
					<h3 class="text-sm font-semibold">{{ selectedSighting.species.commonName }}</h3>
					<p class="text-xs italic text-[var(--color-text-muted)]">{{ selectedSighting.species.scientificName }}</p>
				</div>
				<button class="text-[var(--color-text-muted)] hover:text-[var(--color-text)]" @click="selectedSighting = null">
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="space-y-2 px-4 py-3">
				<div class="flex items-center gap-2 text-xs">
					<span
						class="rounded-full px-2 py-0.5 font-medium text-white"
						:style="{ backgroundColor: RARITY_COLORS[selectedSighting.rarity] }"
					>
						{{ rarityLabel(selectedSighting.rarity) }}
					</span>
					<span
						:class="[
							'rounded-full px-2 py-0.5 font-medium',
							selectedSighting.status === 'confirmed'
								? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
								: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
						]"
					>
						{{ selectedSighting.status === "confirmed" ? "Confirmed" : "Unconfirmed" }}
					</span>
				</div>
				<div v-if="selectedSighting.observerUsername" class="text-xs text-[var(--color-text-muted)]">
					Spotted by <span class="font-medium text-[var(--color-text)]">{{ selectedSighting.observerUsername }}</span>
				</div>
				<div class="text-xs text-[var(--color-text-muted)]">
					{{ formatDate(selectedSighting.createdAt) }} &middot; {{ selectedSighting.distanceKm }} km away
				</div>
				<div v-if="selectedSighting.confirmationCount > 0" class="text-xs text-[var(--color-text-muted)]">
					{{ selectedSighting.confirmationCount }} confirmation{{ selectedSighting.confirmationCount !== 1 ? "s" : "" }}
				</div>
				<div v-if="selectedSighting.photoUrls.length > 0" class="flex gap-2 overflow-x-auto pt-1">
					<img
						v-for="(url, i) in selectedSighting.photoUrls.slice(0, 3)"
						:key="i"
						:src="url"
						alt="Sighting photo"
						class="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
					/>
				</div>
			</div>
		</div>

		<!-- Hotspot detail panel -->
		<div
			v-if="selectedHotspot"
			class="absolute bottom-20 right-3 z-30 w-72 rounded-xl bg-[var(--color-bg-elevated)] shadow-xl md:bottom-4"
		>
			<div class="flex items-start justify-between border-b border-[var(--color-border)] px-4 py-3">
				<h3 class="text-sm font-semibold">{{ selectedHotspot.name }}</h3>
				<button class="text-[var(--color-text-muted)] hover:text-[var(--color-text)]" @click="selectedHotspot = null">
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="space-y-2 px-4 py-3 text-xs">
				<p v-if="selectedHotspot.speciesCount" class="text-[var(--color-text-muted)]">
					<span class="font-medium text-[var(--color-text)]">{{ selectedHotspot.speciesCount }}</span> species recorded
				</p>
				<p class="text-[var(--color-text-muted)]">{{ selectedHotspot.distanceKm }} km away</p>
			</div>
		</div>

		<!-- Legend -->
		<div class="absolute bottom-24 right-16 z-20 rounded-lg bg-[var(--color-bg-elevated)] px-3 py-2 shadow-md md:bottom-6">
			<div class="flex items-center gap-3 text-[10px] text-[var(--color-text-muted)]">
				<span class="flex items-center gap-1">
					<span class="h-2.5 w-2.5 rounded-full bg-[#22c55e]" /> Common
				</span>
				<span class="flex items-center gap-1">
					<span class="h-2.5 w-2.5 rounded-full bg-[#eab308]" /> Uncommon
				</span>
				<span class="flex items-center gap-1">
					<span class="h-2.5 w-2.5 rounded-full bg-[#f97316]" /> Rare
				</span>
				<span class="flex items-center gap-1">
					<span class="h-2.5 w-2.5 rounded-full bg-[#ef4444]" /> Mega Rare
				</span>
			</div>
		</div>
	</div>
</template>
