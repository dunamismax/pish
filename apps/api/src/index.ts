import { initSentry } from "./lib/sentry";

// Initialize Sentry before anything else
initSentry();

import { Elysia } from "elysia";
import { authRoutes } from "./routes/auth";
import { healthRoutes } from "./routes/health";
import { speciesRoutes } from "./routes/species";

const port = Number(process.env.API_PORT) || 3001;

const app = new Elysia().use(healthRoutes).use(authRoutes).use(speciesRoutes).listen(port);

console.log(`[api] listening on http://localhost:${port}`);

export type App = typeof app;
