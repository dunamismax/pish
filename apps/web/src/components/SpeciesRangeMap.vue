<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import maplibregl from "maplibre-gl";

interface SightingLocation {
	lat: number;
	lng: number;
	rarity: string;
	status: string;
	createdAt: string;
}

const props = defineProps<{
	locations: SightingLocation[];
}>();

const mapContainer = ref<HTMLDivElement | null>(null);
let map: maplibregl.Map | null = null;

const RARITY_COLORS: Record<string, string> = {
	common: "#22c55e",
	uncommon: "#eab308",
	rare: "#f97316",
	mega_rare: "#ef4444",
};

onMounted(() => {
	if (!mapContainer.value || props.locations.length === 0) return;

	// Calculate bounds from locations
	const lats = props.locations.map((l) => l.lat);
	const lngs = props.locations.map((l) => l.lng);
	const minLat = Math.min(...lats);
	const maxLat = Math.max(...lats);
	const minLng = Math.min(...lngs);
	const maxLng = Math.max(...lngs);

	map = new maplibregl.Map({
		container: mapContainer.value,
		style: {
			version: 8,
			sources: {
				osm: {
					type: "raster",
					tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
					tileSize: 256,
					attribution: "&copy; OpenStreetMap",
				},
			},
			layers: [
				{
					id: "osm",
					type: "raster",
					source: "osm",
				},
			],
		},
		bounds: [
			[minLng - 0.5, minLat - 0.5],
			[maxLng + 0.5, maxLat + 0.5],
		],
		maxZoom: 14,
		interactive: true,
		attributionControl: false,
	});

	map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

	map.on("load", () => {
		if (!map) return;

		// Add sighting points as a GeoJSON source
		const features = props.locations.map((loc) => ({
			type: "Feature" as const,
			geometry: {
				type: "Point" as const,
				coordinates: [loc.lng, loc.lat],
			},
			properties: {
				rarity: loc.rarity,
				status: loc.status,
				color: RARITY_COLORS[loc.rarity] ?? "#22c55e",
			},
		}));

		map.addSource("sighting-points", {
			type: "geojson",
			data: {
				type: "FeatureCollection",
				features,
			},
		});

		map.addLayer({
			id: "sighting-circles",
			type: "circle",
			source: "sighting-points",
			paint: {
				"circle-radius": 5,
				"circle-color": ["get", "color"],
				"circle-stroke-width": 1.5,
				"circle-stroke-color": "#ffffff",
				"circle-opacity": ["case", ["==", ["get", "status"], "confirmed"], 0.9, 0.5],
			},
		});
	});
});

onUnmounted(() => {
	map?.remove();
	map = null;
});
</script>

<template>
	<div class="w-full">
		<h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
			Sighting Map
		</h3>
		<div v-if="locations.length === 0" class="flex h-48 items-center justify-center rounded-lg bg-[var(--color-bg-alt)]">
			<p class="text-sm text-[var(--color-text-muted)]">No sighting locations recorded yet</p>
		</div>
		<div v-else ref="mapContainer" class="h-64 w-full rounded-lg overflow-hidden" />
	</div>
</template>
