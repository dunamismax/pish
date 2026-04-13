<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue";
import * as d3 from "d3";

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
const svgRef = ref<SVGSVGElement | null>(null);

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const currentMonth = new Date().getMonth() + 1;

function renderChart() {
	const svg = svgRef.value;
	if (!svg || data.value.length === 0) return;

	const container = svg.parentElement;
	if (!container) return;

	const width = container.clientWidth;
	const height = 180;
	const margin = { top: 12, right: 8, bottom: 28, left: 36 };
	const innerW = width - margin.left - margin.right;
	const innerH = height - margin.top - margin.bottom;

	d3.select(svg).selectAll("*").remove();

	const root = d3
		.select(svg)
		.attr("width", width)
		.attr("height", height)
		.attr("viewBox", `0 0 ${width} ${height}`);

	const g = root.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

	// Build full 12-month dataset
	const fullData: FrequencyData[] = [];
	for (let m = 1; m <= 12; m++) {
		const found = data.value.find((d) => d.month === m);
		fullData.push(found ?? { month: m, frequency: 0, sampleSize: null });
	}

	const maxFreq = Math.max(d3.max(fullData, (d) => d.frequency) ?? 0, 0.01);

	const x = d3
		.scaleBand<number>()
		.domain(fullData.map((d) => d.month))
		.range([0, innerW])
		.padding(0.2);

	const y = d3.scaleLinear().domain([0, maxFreq]).range([innerH, 0]).nice();

	// Y axis
	g.append("g")
		.call(
			d3
				.axisLeft(y)
				.ticks(4)
				.tickFormat((d) => `${(Number(d) * 100).toFixed(0)}%`),
		)
		.call((sel) => sel.select(".domain").remove())
		.call((sel) =>
			sel
				.selectAll(".tick line")
				.attr("x2", innerW)
				.attr("stroke", "var(--color-border)")
				.attr("stroke-dasharray", "2,2"),
		)
		.call((sel) => sel.selectAll(".tick text").attr("fill", "var(--color-text-muted)").attr("font-size", "10px"));

	// X axis
	g.append("g")
		.attr("transform", `translate(0,${innerH})`)
		.call(d3.axisBottom(x).tickFormat((d) => MONTH_LABELS[Number(d) - 1]))
		.call((sel) => sel.select(".domain").remove())
		.call((sel) => sel.selectAll(".tick line").remove())
		.call((sel) =>
			sel.selectAll(".tick text").attr("fill", "var(--color-text-muted)").attr("font-size", "10px"),
		);

	// Highlight current month label
	g.selectAll(".tick text").each(function (_d, i) {
		if (i + 1 === currentMonth) {
			d3.select(this).attr("fill", "var(--color-primary-600)").attr("font-weight", "600");
		}
	});

	// Bars
	const bars = g
		.selectAll(".bar")
		.data(fullData)
		.enter()
		.append("rect")
		.attr("class", "bar")
		.attr("x", (d) => x(d.month) ?? 0)
		.attr("width", x.bandwidth())
		.attr("y", innerH)
		.attr("height", 0)
		.attr("rx", 2)
		.attr("fill", (d) => (d.month === currentMonth ? "var(--color-primary-600)" : "var(--color-primary-300)"));

	// Animate bars in
	bars
		.transition()
		.duration(400)
		.delay((_d, i) => i * 30)
		.attr("y", (d) => y(d.frequency))
		.attr("height", (d) => innerH - y(d.frequency));

	// Tooltip group (invisible until hover)
	const tooltip = root
		.append("g")
		.attr("class", "tooltip-group")
		.style("pointer-events", "none")
		.style("opacity", 0);

	const tooltipBg = tooltip.append("rect").attr("rx", 4).attr("fill", "var(--color-neutral-800)");

	const tooltipText = tooltip.append("text").attr("fill", "white").attr("font-size", "11px").attr("text-anchor", "middle");

	// Hover overlay rects for interaction
	g.selectAll(".hover-rect")
		.data(fullData)
		.enter()
		.append("rect")
		.attr("x", (d) => x(d.month) ?? 0)
		.attr("width", x.bandwidth())
		.attr("y", 0)
		.attr("height", innerH)
		.attr("fill", "transparent")
		.style("cursor", "pointer")
		.on("mouseenter", (_event, d) => {
			const barX = (x(d.month) ?? 0) + x.bandwidth() / 2 + margin.left;
			const barY = y(d.frequency) + margin.top - 8;
			const pct = `${(d.frequency * 100).toFixed(1)}%`;

			tooltipText.text(pct);
			const bbox = (tooltipText.node() as SVGTextElement).getBBox();
			const padX = 6;
			const padY = 3;
			tooltipBg
				.attr("x", barX - bbox.width / 2 - padX)
				.attr("y", barY - bbox.height - padY)
				.attr("width", bbox.width + padX * 2)
				.attr("height", bbox.height + padY * 2);
			tooltipText.attr("x", barX).attr("y", barY - padY);

			tooltip.style("opacity", 1);
		})
		.on("mouseleave", () => {
			tooltip.style("opacity", 0);
		});
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

watch(
	[data, isLoading],
	async () => {
		if (!isLoading.value && data.value.length > 0) {
			await nextTick();
			renderChart();
		}
	},
	{ flush: "post" },
);
</script>

<template>
	<div class="w-full">
		<h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
			Monthly Frequency
		</h3>

		<div v-if="isLoading" class="flex h-[180px] items-center justify-center">
			<div
				class="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-primary-600)] border-t-transparent"
			/>
		</div>

		<div v-else-if="error || data.length === 0" class="flex h-[180px] items-center justify-center">
			<p class="text-sm text-[var(--color-text-muted)]">No frequency data available</p>
		</div>

		<div v-else class="w-full">
			<svg ref="svgRef" class="w-full" />
		</div>
	</div>
</template>
