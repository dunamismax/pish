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

console.log("[worker] listening for jobs...");
