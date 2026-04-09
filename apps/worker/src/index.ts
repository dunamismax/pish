import * as Sentry from "@sentry/bun";

// Initialize Sentry
const sentryDsn = process.env.SENTRY_DSN || "";
if (sentryDsn) {
	Sentry.init({
		dsn: sentryDsn,
		environment: process.env.NODE_ENV || "development",
		tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
	});
	console.log("[worker] sentry initialized");
}

import { Worker } from "bullmq";
import IORedis from "ioredis";
import { processAlertDispatch } from "./jobs/alert-dispatch";
import { processImages } from "./jobs/image-processing";

const connection = new IORedis(process.env.VALKEY_URL || "redis://localhost:6379", {
	maxRetriesPerRequest: null,
});

const worker = new Worker(
	"default",
	async (job) => {
		console.log(`[worker] processing job ${job.name} (${job.id})`);
		switch (job.name) {
			case "send-verification-email":
				console.log(`[worker] sending verification email to ${job.data.email}`);
				break;
			case "send-password-reset-email":
				console.log(`[worker] sending password reset email to ${job.data.email}`);
				break;
			case "alert-dispatch":
				await processAlertDispatch(job);
				break;
			case "process-sighting-images":
				await processImages(job);
				break;
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
	Sentry.captureException(err, { extra: { jobId: job?.id, jobName: job?.name } });
});

// ─── Valkey Subscriber for Confirmed Sightings ──────────────────
// Listen for confirmed sightings published by the API and queue alert dispatch
const subscriber = new IORedis(process.env.VALKEY_URL || "redis://localhost:6379", {
	maxRetriesPerRequest: null,
});

subscriber.subscribe("sighting:confirmed", (err) => {
	if (err) {
		console.error("[worker] failed to subscribe to sighting:confirmed:", err.message);
		return;
	}
	console.log("[worker] subscribed to sighting:confirmed");
});

subscriber.subscribe("job:process-sighting-images", (err) => {
	if (err) {
		console.error("[worker] failed to subscribe to job:process-sighting-images:", err.message);
		return;
	}
	console.log("[worker] subscribed to job:process-sighting-images");
});

subscriber.on("message", async (channel, message) => {
	try {
		const data = JSON.parse(message);

		if (channel === "sighting:confirmed") {
			const { Queue } = await import("bullmq");
			const queue = new Queue("default", { connection: { host: "localhost", port: 6379 } });
			await queue.add("alert-dispatch", data);
			await queue.close();
			console.log(`[worker] queued alert-dispatch for sighting ${data.id}`);
		}

		if (channel === "job:process-sighting-images") {
			const { Queue } = await import("bullmq");
			const queue = new Queue("default", { connection: { host: "localhost", port: 6379 } });
			await queue.add("process-sighting-images", data);
			await queue.close();
			console.log(`[worker] queued image processing for sighting ${data.sightingId}`);
		}
	} catch (err) {
		console.error(`[worker] error handling ${channel} message:`, err);
	}
});

console.log("[worker] listening for jobs...");
