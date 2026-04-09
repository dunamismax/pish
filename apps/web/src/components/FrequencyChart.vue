<script setup lang="ts">
import { ref, onMounted, computed } from "vue";

const props = defineProps<{
	speciesId: string;
	regionCode?: string;
}>();

interface FrequencyData {
	month: number;
	frequency: number;
	sampleSize: number | null;
}

const data = ref<FrequencyData[]>([]);
const isLoading = ref(true);
const error = ref(false);

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const currentMonth = new Date().getMonth() + 1;

const maxFrequency = computed(() => {
	if (data.value.length === 0) return 1;
	return Math.max(...data.value.map((d) => d.frequency), 0.01);
});

function getBarHeight(frequency: number): string {
	const pct = (frequency / maxFrequency.value) * 100;
	return `${Math.max(pct, 2)}%`;
}

function formatPct(frequency: number): string {
	return `${(frequency * 100).toFixed(1)}%`;
}

onMounted(async () => {
	try {
		const region = props.regionCode || "US";
		const res = await fetch(`/api/species/${props.speciesId}/frequency?regionCode=${region}`);
		const json = await res.json();
		if (json.ok) {
			data.value = json.data;
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
	<div class="w-full">
		<h3 class="mb-3 text-sm font-semibold">Monthly Frequency</h3>

		<div v-if="isLoading" class="flex h-32 items-center justify-center">
			<div class="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-primary-600)] border-t-transparent" />
		</div>

		<div v-else-if="error || data.length === 0" class="flex h-32 items-center justify-center">
			<p class="text-sm text-[var(--color-text-muted)]">No frequency data available</p>
		</div>

		<div v-else class="flex items-end gap-1" style="height: 120px">
			<div
				v-for="month in 12"
				:key="month"
				class="group relative flex flex-1 flex-col items-center justify-end"
				style="height: 100%"
			>
				<!-- Bar -->
				<div
					class="w-full rounded-t transition-all"
					:class="[
						month === currentMonth
							? 'bg-[var(--color-primary-600)]'
							: 'bg-[var(--color-primary-300)] group-hover:bg-[var(--color-primary-400)]',
					]"
					:style="{ height: getBarHeight(data.find((d) => d.month === month)?.frequency ?? 0) }"
				/>
				<!-- Label -->
				<span
					class="mt-1 text-[9px]"
					:class="month === currentMonth ? 'font-bold text-[var(--color-primary-600)]' : 'text-[var(--color-text-muted)]'"
				>
					{{ MONTH_LABELS[month - 1] }}
				</span>
				<!-- Tooltip -->
				<div class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-[var(--color-neutral-800)] px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap">
					{{ formatPct(data.find((d) => d.month === month)?.frequency ?? 0) }}
				</div>
			</div>
		</div>
	</div>
</template>
