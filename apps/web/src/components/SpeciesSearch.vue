<script setup lang="ts">
import { ref, watch } from "vue";

interface SpeciesHit {
	id: string;
	speciesCode: string;
	commonName: string;
	scientificName: string;
	familyCommonName?: string | null;
}

const query = ref("");
const results = ref<SpeciesHit[]>([]);
const isSearching = ref(false);
const isFocused = ref(false);
let debounceTimer: ReturnType<typeof setTimeout>;

watch(query, (val) => {
	clearTimeout(debounceTimer);
	if (!val || val.length < 2) {
		results.value = [];
		return;
	}
	debounceTimer = setTimeout(() => search(val), 250);
});

async function search(q: string) {
	isSearching.value = true;
	try {
		const res = await fetch(`/api/species/search?q=${encodeURIComponent(q)}&limit=10`);
		const json = await res.json();
		if (json.ok) {
			results.value = json.data.hits;
		}
	} catch {
		results.value = [];
	} finally {
		isSearching.value = false;
	}
}

function selectSpecies(species: SpeciesHit) {
	window.location.href = `/app/field-guide/${species.id}`;
}

function handleBlur() {
	// Delay to allow click on results
	setTimeout(() => {
		isFocused.value = false;
	}, 200);
}
</script>

<template>
	<div class="relative w-full max-w-xl">
		<div class="relative">
			<svg
				class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-text-muted)]"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="1.5"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
				/>
			</svg>
			<input
				v-model="query"
				type="text"
				placeholder="Search species by name..."
				class="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-3 pl-10 pr-4 text-sm placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/20"
				@focus="isFocused = true"
				@blur="handleBlur"
			/>
			<div
				v-if="isSearching"
				class="absolute right-3 top-1/2 -translate-y-1/2"
			>
				<div class="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-primary-600)] border-t-transparent" />
			</div>
		</div>

		<!-- Results dropdown -->
		<div
			v-if="isFocused && results.length > 0"
			class="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-xl"
		>
			<ul class="divide-y divide-[var(--color-border)]">
				<li
					v-for="species in results"
					:key="species.id"
					class="cursor-pointer px-4 py-3 hover:bg-[var(--color-bg-alt)] transition-colors"
					@mousedown.prevent="selectSpecies(species)"
				>
					<p class="text-sm font-medium">{{ species.commonName }}</p>
					<p class="text-xs text-[var(--color-text-muted)]">
						<span class="italic">{{ species.scientificName }}</span>
						<span v-if="species.familyCommonName"> &middot; {{ species.familyCommonName }}</span>
					</p>
				</li>
			</ul>
		</div>

		<!-- Empty state -->
		<div
			v-if="isFocused && query.length >= 2 && !isSearching && results.length === 0"
			class="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 text-center shadow-xl"
		>
			<p class="text-sm text-[var(--color-text-muted)]">No species found for "{{ query }}"</p>
		</div>
	</div>
</template>
