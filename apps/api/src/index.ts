import { Elysia } from "elysia";
import { healthRoutes } from "./routes/health";

const port = Number(process.env.API_PORT) || 3001;

const app = new Elysia().use(healthRoutes).listen(port);

console.log(`[api] listening on http://localhost:${port}`);

export type App = typeof app;
