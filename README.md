# Pish

The all-in-one birding platform. Real-time bird sound identification, crowd-confirmed sighting alerts, social community features, trip planning, gamification, and personal stats. Think Strava meets eBird meets Merlin.

## Quick Start

```bash
# Install dependencies
bun install

# Start infrastructure services
docker compose up -d postgres valkey meilisearch

# Run database migrations
bun run db:migrate

# Start all services in dev mode
bun run dev
```

Direct service ports are `http://localhost:3000` for the web app and `http://localhost:3001` for the API.

The canonical integrated local entrypoint is Caddy at `http://localhost`.

To run the full stack behind Caddy (matching production routing):

```bash
docker compose up -d
```

Then visit `http://localhost`.

## Repo Structure

```
pish/
  apps/
    web/          # Astro + Vue frontend
    api/          # Elysia API server
    worker/       # BullMQ background worker
  packages/
    contracts/    # Shared Zod schemas and types
    email/        # Email templates (Resend)
  db/
    migrations/   # SQL migration files
    seeds/        # Seed data scripts
  ops/
    docker/       # Dockerfiles
  Caddyfile       # Reverse proxy config
  compose.yaml    # Docker Compose orchestration
  biome.json      # Lint and format config
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start all services in development mode |
| `bun run build` | Build all packages and apps |
| `bun run test` | Run tests |
| `bun run typecheck` | Type check all packages |
| `bun run lint` | Lint and format check with Biome |
| `bun run verify` | Full quality gate (install, lint, typecheck, test, build) |
| `bun run db:migrate` | Run pending database migrations |
| `bun run db:migrate:create <name>` | Create a new migration file |

## Stack

- **TypeScript** across the full stack
- **Bun** for runtime, package management, scripts, and tests
- **Astro** for page composition and server-first delivery
- **Vue 3** for interactive islands (maps, feeds, dashboards)
- **Tailwind CSS v4** with CSS-native design tokens
- **Elysia** for the Bun-native HTTP API
- **Zod** for shared validation and contracts
- **PostgreSQL** with **PostGIS** for geospatial data
- **Valkey** for caching, sessions, rate limiting, and pub/sub
- **BullMQ** for background jobs
- **MeiliSearch** for fast, typo-tolerant search
- **Caddy** for reverse proxy and TLS
- **Docker Compose** for local orchestration
- **Biome** for lint and format
- **Playwright** for browser E2E tests

## License

See [LICENSE](./LICENSE).
