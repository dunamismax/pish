<script setup lang="ts">
import { ref, onMounted } from "vue";

const status = ref<"loading" | "ok" | "error">("loading");
const message = ref("");

onMounted(async () => {
	try {
		const res = await fetch("/api/health");
		const data = await res.json();
		status.value = data.ok ? "ok" : "error";
		message.value = data.ok ? `API healthy at ${data.timestamp}` : "API returned error";
	} catch {
		status.value = "error";
		message.value = "Could not reach API";
	}
});
</script>

<template>
	<div class="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm">
		<span
			class="h-2 w-2 rounded-full"
			:class="{
				'bg-[var(--color-success)]': status === 'ok',
				'bg-[var(--color-error)]': status === 'error',
				'bg-[var(--color-warning)]': status === 'loading',
			}"
		/>
		<span v-if="status === 'loading'" class="text-[var(--color-text-muted)]">Checking API...</span>
		<span v-else-if="status === 'ok'" class="text-[var(--color-success)]">{{ message }}</span>
		<span v-else class="text-[var(--color-error)]">{{ message }}</span>
	</div>
</template>
