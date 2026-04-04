import { initSentry } from "./lib/sentry";

// Initialize Sentry before anything else
initSentry();

import { Elysia } from "elysia";
import { alertRoutes } from "./routes/alerts";
import { authRoutes } from "./routes/auth";
import { healthRoutes } from "./routes/health";
import { notificationRoutes } from "./routes/notifications";
import { sightingRoutes } from "./routes/sightings";
import { speciesRoutes } from "./routes/species";

const port = Number(process.env.API_PORT) || 3001;

const app = new Elysia()
	.use(healthRoutes)
	.use(authRoutes)
	.use(speciesRoutes)
	.use(sightingRoutes)
	.use(alertRoutes)
	.use(notificationRoutes)
	.listen(port);

console.log(`[api] listening on http://localhost:${port}`);

export type App = typeof app;
