import { Worker } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.VALKEY_URL || "redis://localhost:6379", {
	maxRetriesPerRequest: null,
});

const worker = new Worker(
	"default",
	async (job) => {
		console.log(`[worker] processing job ${job.name} (${job.id})`);
		// Job handlers will be registered here as features are built
		switch (job.name) {
			default:
				console.log(`[worker] unknown job type: ${job.name}`);
		}
	},
	{ connection },
);

worker.on("completed", (job) => {
	console.log(`[worker] job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
	console.error(`[worker] job ${job?.id} failed:`, err.message);
});

console.log("[worker] listening for jobs...");
