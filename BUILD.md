# BUILD.md

> **Required operating rule:** any agent who completes work from this plan, changes scope, or learns repo truth that affects sequencing must update this file in the same change set. Keep the checkboxes honest. Do not mark boxes complete unless the repo already proves them.

Pish is in active greenfield build mode. This file is the execution authority for taking the repo from an empty shell to a launched birding platform at getpish.com.

Pish is the all-in-one birding platform that replaces five apps with one. It combines real-time bird sound identification, a visual field guide, crowd-confirmed sighting alerts, social community features, trip planning, gamification, and personal stats into a single progressive web app. Think Strava meets eBird meets Merlin, built for the modern birder who wants community, not just a checklist.

## Current repo truth

- [x] The repo is a Bun workspace monorepo.
- [x] Astro owns the page shells and routing model.
- [x] Elysia serves the API surface under `/api`.
- [x] PostgreSQL, PostGIS, Valkey, MeiliSearch, and Caddy are wired through `compose.yaml`.
- [x] Shared Zod contracts live in `packages/contracts`.
- [x] The local developer entrypoint is `bun run dev`.
- [ ] Auth, sessions, and protected routes are implemented.
- [ ] Species taxonomy and eBird data sync are implemented.
- [ ] Sighting reports and crowd-confirmed alert dispatch are implemented.
- [ ] Sound ID, checklists, and field guide are implemented.
- [ ] Social features (groups, events, chat, feed) are implemented.
- [ ] Challenges, badges, leaderboards, and stats dashboard are implemented.
- [ ] Trip planner and Stripe billing are implemented.
- [ ] Admin panel and moderation tools are implemented.
- [ ] PWA with offline mode and push notifications is implemented.

## Product guardrails

- [x] Pish is a serious birding platform, not a novelty site.
- [x] The browser is the primary product surface. PWA is the delivery model.
- [x] Astro remains the page owner everywhere unless a focused Vue island clearly earns its place.
- [x] Vue appears for maps, feeds, dashboards, sound ID, and board-adjacent interaction, not for site-wide routing.
- [x] PostgreSQL with PostGIS is the durable system of record.
- [x] Valkey owns the fast layer: sessions, caching, rate limiting, pub/sub, sorted sets.
- [x] BullMQ handles all background work: alerts, sync, media, email, stats, search indexing.
- [x] MeiliSearch powers species, user, and hotspot search.
- [x] Auth, confirmation thresholds, trust scores, and rarity classification are correctness problems first.
- [x] The sighting confirmation and alert system is the killer feature. It must be trustworthy and fast.
- [x] Alerts are never algorithmic. Chronological feed. No engagement manipulation.
- [x] eBird is respected, not replaced. Pish syncs to eBird, not away from it.
- [x] Launch scope is SW Florida dogfood-ready, not global-scale-on-day-one.
- [x] Core community features are never paywalled. Network effects depend on free access.
- [x] Offline capability is non-negotiable. Birders lose signal in the field.
- [x] Abuse controls and trust mechanics are part of launch quality, not post-launch debt.

## Stack

- **TypeScript** across frontend, backend, and shared contracts
- **Bun** for runtime, package management, scripts, and tests
- **Astro** for page composition, SSR, routing, and site structure
- **Vue 3** for interactive UI: maps, feeds, dashboards, sound ID, forms, chat
- **Tailwind CSS v4** with design tokens via CSS custom properties
- **@vueuse/motion** for micro-interactions, page transitions, and animation
- **Elysia** for the Bun-native HTTP API and WebSocket endpoints
- **Zod** for shared validation, request parsing, and contract definitions
- **PostgreSQL** with **PostGIS** for geospatial queries
- **Raw SQL first** with `postgres` driver; Kysely only when earned
- **Valkey** for caching, sessions, rate limiting, pub/sub, sorted sets
- **BullMQ** for background jobs backed by Valkey
- **Lucia** + **Arctic** + **@node-rs/argon2** for auth
- **MeiliSearch** for species, user, and hotspot search
- **MapLibre GL JS** with OpenStreetMap tiles for maps
- **D3** for stats visualizations, county maps, frequency charts, accumulation curves
- **Sharp** for server-side image processing
- **Resend** + **@vue-email/components** for transactional email
- **Stripe** for Pish Pro subscriptions
- **Sentry** for error tracking and performance monitoring
- **BirdNET** TFLite model via WASM or server-side inference for sound ID
- **Web Push API** for PWA push notifications
- **Docker Compose** for local orchestration and deployment
- **Caddy** for TLS termination, reverse proxy, and compression
- **Biome** for lint and format
- **Playwright** for browser E2E

## Phase status summary

- [x] Phase 0 - Product framing and repo bootstrap.
- [ ] Phase 1 - Database foundation, auth, and species data.
- [ ] Phase 2 - Sighting reports, confirmation system, and alert dispatch.
- [ ] Phase 3 - Map, field guide, and core navigation.
- [ ] Phase 4 - Checklists, sound ID, and field tools.
- [ ] Phase 5 - Social feed, groups, events, and chat.
- [ ] Phase 6 - Challenges, badges, leaderboards, and stats dashboard.
- [ ] Phase 7 - Trip planner, weather, tides, and intelligence features.
- [ ] Phase 8 - Stripe billing and Pish Pro.
- [ ] Phase 9 - PWA, offline mode, and push notifications.
- [ ] Phase 10 - Admin panel, moderation, and abuse controls.
- [ ] Phase 11 - Reliability, performance, and UX polish.
- [ ] Phase 12 - Deployment, staging, and launch hardening.
- [ ] Phase 13 - Launch and immediate post-launch follow-through.

## Phase 0 - Product framing and repo bootstrap

### Objectives

- [x] Create the Bun workspace and target repo structure.
- [x] Stand up the full local development environment.
- [x] Prove that all services boot and talk to each other before feature work begins.

### Checklist

- [x] Add repo-root Bun workspace configuration with `apps/web`, `apps/api`, `apps/worker`, `packages/contracts`, `packages/email`.
- [x] Add `apps/web` Astro + Vue scaffolding with Tailwind CSS v4, design tokens in `tokens.css`, and @vueuse/motion.
- [x] Add `apps/api` Elysia service scaffolding with health and readiness endpoints.
- [x] Add `apps/worker` BullMQ worker scaffolding.
- [x] Add `packages/contracts` with initial shared Zod schemas.
- [x] Add `packages/email` with Vue email template scaffolding for Resend.
- [x] Add `db/migrations/` directory and SQL migration runner.
- [x] Add `compose.yaml` for `caddy`, `web`, `api`, `worker`, `postgres` (with PostGIS), `valkey`, and `meilisearch`.
- [x] Add `Caddyfile` for local reverse proxying of web, API, and WebSocket services.
- [x] Add `.env.example` with all service connection strings and API keys.
- [x] Add `biome.json` for lint and format configuration.
- [x] Add `tsconfig.base.json` and per-package TypeScript configs.
- [x] Add root workspace scripts: `dev`, `test`, `typecheck`, `lint`, `build`, and `verify`.
- [x] Add `README.md` with local setup instructions and repo purpose.
- [x] Add Playwright configuration for E2E smoke coverage.

### Exit criteria

- [x] A fresh clone can `bun install`, start all services, and hit health endpoints.
- [x] The repo has one obvious developer entrypoint (`bun run dev`).
- [x] The workspace structure matches the intended long-term shape.
- [x] The web shell loads through Caddy instead of bypassing the intended runtime shape.

### Verification

- [x] `bun install`
- [x] `bun run typecheck`
- [x] `bun run lint`
- [x] `bun run build`
- [x] `bun run verify`
- [ ] `docker compose up -d --build` with all services healthy.

## Phase 1 - Database foundation, auth, and species data

### Objectives

- [ ] Implement the durable user, session, and species data model.
- [ ] Establish secure authentication before any feature work.
- [ ] Import eBird taxonomy so species search and frequency data are available from the start.

### Checklist

- [ ] Implement SQL migrations for `users`, `sessions`, `oauth_accounts`, `email_verification_tokens`, `password_reset_tokens`, and role/permission columns.
- [ ] Enable PostGIS extension and add geospatial column support.
- [ ] Implement sign up, sign in, sign out, and session refresh flows with Lucia.
- [ ] Implement password hashing with @node-rs/argon2 (argon2id).
- [ ] Implement OAuth flows with Arctic (Google, Apple).
- [ ] Implement email verification flow with Resend.
- [ ] Implement password reset flow with time-limited, single-use tokens.
- [ ] Implement protected-route middleware and session validation.
- [ ] Add username rules, uniqueness policy, and profile bootstrap flow.
- [ ] Add account-status handling for active, banned, and new_user states.
- [ ] Implement role and permission definitions: god, admin, regional_mod, trusted, user, new_user, banned.
- [ ] Implement `species` and `species_frequency` tables.
- [ ] Build eBird taxonomy import script and seed the species database.
- [ ] Configure MeiliSearch species index with autocomplete, fuzzy matching, and frequency-weighted ranking.
- [ ] Add Valkey integration for session storage and sliding-window rate limiting on auth endpoints.
- [ ] Initialize Sentry in both `apps/web` and `apps/api`.
- [ ] Add Zod schemas for user, session, species, and auth payloads in `packages/contracts`.

### Exit criteria

- [ ] Users can create accounts, sign in, stay signed in with secure server-side sessions, and sign out.
- [ ] OAuth sign in works for Google and Apple.
- [ ] Email verification and password reset flows work end to end.
- [ ] Protected routes enforce valid auth.
- [ ] The species database contains the full eBird taxonomy.
- [ ] Species search returns fast, typo-tolerant results from MeiliSearch.
- [ ] Rate limiting is active on auth endpoints.

### Verification

- [ ] Migration up and reset flows against a clean local PostgreSQL instance.
- [ ] Integration tests for auth success, auth failure, session revocation, and protected routes.
- [ ] Integration tests for OAuth flow simulation.
- [ ] Species search tests against MeiliSearch for autocomplete accuracy and fuzzy matching.
- [ ] Playwright coverage for sign up, sign in, sign out, and session persistence.
- [ ] Rate limit tests confirming 429 responses after threshold.

## Phase 2 - Sighting reports, confirmation system, and alert dispatch

### Objectives

- [ ] Build the core sighting report flow optimized for speed (under 10 seconds for a practiced user).
- [ ] Implement crowd-confirmed alert dispatch with trust-weighted confirmation thresholds.
- [ ] Make the alert system trustworthy enough that serious birders rely on it.

### Checklist

- [ ] Implement `sightings`, `sighting_confirmations`, and `sighting_flags` tables.
- [ ] Implement `user_species_alerts` and `user_location_alerts` tables.
- [ ] Build sighting report API: GPS auto-fill, species search with MeiliSearch (sorted by frequency for location and month), optional photo/audio attachment, notes.
- [ ] Implement rarity auto-classification based on eBird frequency data: common (>30%), uncommon (10-30%), rare (1-10%), mega_rare (<1%).
- [ ] Implement confirmation threshold logic: common (no confirmation needed), uncommon (feed only), rare (2 confirmations within 1 mile and 24 hours), mega_rare (2 confirmations OR 1 from trusted/mod).
- [ ] Implement trust-weighted thresholds: trusted reporters need only 1 additional confirmation; new users need 3 for rare+.
- [ ] Implement confirmation submission flow: nearby users can confirm with optional photo evidence.
- [ ] Build BullMQ alert dispatch job: fan out push notifications to users with matching species/location alerts within configured radius.
- [ ] Publish confirmed sightings to Valkey pub/sub for real-time WebSocket feed broadcast.
- [ ] Create in-app `notifications` table and notification delivery.
- [ ] Implement anti-abuse escalation: 3 flagged reports raises threshold, 5 requires mod review, 10 auto-bans pending review.
- [ ] Implement false report count decay (1 per quarter).
- [ ] Implement sighting flagging and moderation resolution flow.
- [ ] Add Sharp image processing via BullMQ for sighting photo uploads (thumbnail, WebP conversion, EXIF stripping).
- [ ] Add Zod schemas for sighting, confirmation, flag, alert, and notification payloads.

### Exit criteria

- [ ] A user can report a sighting in under 10 seconds with species autocomplete, GPS, and optional media.
- [ ] Rarity classification is automatic and correct based on eBird frequency data.
- [ ] Rare sightings trigger alerts only after confirmation thresholds are met.
- [ ] Alert dispatch fans out push notifications and in-app notifications to matching subscribers.
- [ ] Anti-abuse escalation works end to end.
- [ ] Photo uploads are processed asynchronously with thumbnails and WebP variants.

### Verification

- [ ] Integration tests for sighting creation, rarity classification, and confirmation threshold logic.
- [ ] Integration tests for alert dispatch fan-out against various alert subscription configurations.
- [ ] Integration tests for trust-weighted confirmation thresholds (trusted reporter, new user, standard user).
- [ ] Anti-abuse escalation tests for flagged report counts and consequences.
- [ ] Image processing pipeline tests for thumbnail generation and format conversion.
- [ ] Playwright coverage for sighting report flow, confirmation flow, and notification delivery.

## Phase 3 - Map, field guide, and core navigation

### Objectives

- [ ] Build the map as the primary navigation surface. Every other feature connects back to the map.
- [ ] Build the field guide as a built-in species reference that birders actually use in the field.
- [ ] Establish the Astro page structure and Vue island boundaries for the authenticated app shell.

### Checklist

- [ ] Build the Astro application shell with `AppLayout.astro` (authenticated) and `PublicLayout.astro` (marketing/landing).
- [ ] Build Astro routes for landing page, auth pages, and all `/app/*` authenticated routes.
- [ ] Build the full-screen MapLibre GL map as the home screen at `/app/map`.
- [ ] Implement map layers: recent sightings (color-coded by rarity, solid=confirmed, hollow=unconfirmed), eBird hotspots, user checklists, events, heatmap mode.
- [ ] Implement "What's near me" quick view: recent sightings within configurable radius.
- [ ] Implement tap interactions: sighting pin details (species, observer, confirmation status, photo), hotspot details (recent species, frequency data, tips), event details (RSVP).
- [ ] Implement PostGIS radius queries for "near me" and location-based sighting/hotspot lookup.
- [ ] Build field guide at `/app/field-guide` with species search (MeiliSearch), species profiles, and "Likely here now" list.
- [ ] Build species profile pages: common and scientific name, family, photos, audio, range map, D3 monthly frequency chart, habitat, field marks, similar species, personal history (first sighting, total sightings, user photos).
- [ ] Implement "Likely here now" logic: GPS coordinates + eBird frequency data + current month, sorted by frequency.
- [ ] Build the authenticated dashboard at `/app/dashboard` as the landing page for signed-in users.
- [ ] Build design tokens, shared component styles, and UI primitives in `packages/ui` or `apps/web/src/components`.
- [ ] Add responsive layout patterns for mobile and desktop.

### Exit criteria

- [ ] The map renders with sighting pins, hotspot markers, and event pins.
- [ ] Tapping a sighting pin shows species, observer, confirmation status, and photo.
- [ ] "What's near me" returns recent sightings within the user's radius using PostGIS.
- [ ] The field guide displays species profiles with frequency data, photos, and audio.
- [ ] "Likely here now" returns species sorted by frequency for the user's current location and month.
- [ ] The app shell has clear Astro-owned page structure with Vue islands only where interaction requires it.
- [ ] Desktop and mobile layouts are both usable.

### Verification

- [ ] PostGIS radius query tests for sighting and hotspot proximity search.
- [ ] MeiliSearch species search tests for autocomplete and frequency-weighted ranking.
- [ ] D3 frequency chart rendering tests.
- [ ] Playwright coverage for map interactions, field guide browsing, and species profile navigation.
- [ ] Responsive layout checks at mobile and desktop breakpoints.
- [ ] `astro check` passes for all routes.

## Phase 4 - Checklists, sound ID, and field tools

### Objectives

- [ ] Make Pish a legitimate replacement for carrying Merlin, BirdNET, and Sibley separately.
- [ ] Build checklists that respect scientific data standards (complete vs incomplete).
- [ ] Integrate BirdNET for real-time bird sound identification.

### Checklist

- [ ] Implement `checklists` and `checklist_entries` tables.
- [ ] Build checklist start flow: set location (auto-GPS or manual pin), type (stationary/traveling/incidental), start time.
- [ ] Build species add flow within active checklist: species search, sound ID quick-add, "likely species" quick-add list.
- [ ] Build checklist end flow: end time, distance (if traveling), completeness toggle with clear explanation of scientific value.
- [ ] Implement "Send to eBird" deep-link with pre-populated species list, counts, location, time, distance, completeness.
- [ ] Track eBird sync status per checklist.
- [ ] Integrate BirdNET TFLite model via WASM for client-side inference.
- [ ] Build "Live listen" mode: continuous microphone streaming, real-time species identification with confidence scores, one-tap add to checklist.
- [ ] Build "Recording analysis" mode: record clip, submit for analysis, receive identification with confidence score and spectrogram visualization.
- [ ] Implement server-side BirdNET inference fallback endpoint for devices that cannot run WASM.
- [ ] Allow sound ID results to be attached to sighting reports as supporting evidence.
- [ ] Add weather data integration: current conditions and 3-day forecast for any birding location via OpenWeatherMap.
- [ ] Implement cold front detection and fallout condition alerts via BullMQ scheduled weather polling.
- [ ] Add tide data integration: NOAA tide predictions for coastal locations.
- [ ] Implement weather and tide overlays on the map.
- [ ] Factor tide data into trip planning and hotspot recommendations.
- [ ] Add Zod schemas for checklist, checklist entry, sound ID result, weather, and tide payloads.

### Exit criteria

- [ ] A user can start a checklist, add species, and end it with correct metadata.
- [ ] The completeness toggle is prominently explained to new users.
- [ ] eBird sync deep-link pre-populates correctly.
- [ ] Sound ID identifies bird calls in real time with confidence scores via WASM.
- [ ] Server-side inference fallback works for unsupported devices.
- [ ] Weather conditions and tide data display for birding locations.
- [ ] Cold front alerts fire when fallout conditions are likely.

### Verification

- [ ] Integration tests for checklist CRUD, entry management, and eBird sync status tracking.
- [ ] Sound ID accuracy tests against known bird call samples.
- [ ] WASM inference tests and server-side fallback tests.
- [ ] Weather and tide data integration tests.
- [ ] Cold front detection logic tests.
- [ ] Playwright coverage for checklist creation, species add, end, and eBird sync flows.
- [ ] Playwright coverage for sound ID live listen and recording analysis modes.

## Phase 5 - Social feed, groups, events, and chat

### Objectives

- [ ] Build the community layer that differentiates Pish from existing tools.
- [ ] Make the feed chronological and trustworthy. Never algorithmic.
- [ ] Give local birding clubs one place to coordinate everything.

### Checklist

- [ ] Build the chronological social feed at `/app/feed`: sightings from followed users, confirmed rare alerts, group activity, event listings, challenge completions.
- [ ] Implement follow system between users.
- [ ] Implement like and comment on sightings with @mention support triggering notifications.
- [ ] Implement inline "Confirm" button on feed sighting posts.
- [ ] Implement `groups` and `group_members` tables.
- [ ] Build group creation, join, and management flows: geographic, interest, club types.
- [ ] Build group pages with feed, event calendar, group chat, shared species list, and member directory.
- [ ] Implement group admin capabilities: pinned announcements, moderation, event creation.
- [ ] Implement `events` and `event_rsvps` tables.
- [ ] Build event creation flow: title, description, location (map pin), date/time, duration, difficulty, max attendees, what to bring, target species, event type.
- [ ] Build RSVP system: Going / Interested / Not Going with attendee list and ICS calendar export.
- [ ] Implement recurring events with configurable recurrence rules.
- [ ] Build post-event combined species checklist and group photo gallery.
- [ ] Implement event reminder emails via Resend + BullMQ.
- [ ] Implement `messages` table for group, DM, and event chat.
- [ ] Build real-time group chat via Elysia WebSocket endpoints backed by Valkey pub/sub.
- [ ] Build direct message 1-on-1 chat.
- [ ] Build event chat channels (active 24 hours before to 24 hours after event).
- [ ] Support sharing sighting links, photos, and location pins in chat with inline sighting cards.
- [ ] Add Zod schemas for feed, group, event, RSVP, message, and chat payloads.

### Exit criteria

- [ ] The feed is strictly chronological and shows relevant sightings, alerts, group activity, and events.
- [ ] Users can follow others and see their sightings in the feed.
- [ ] Groups function as full community hubs with feed, events, chat, and member management.
- [ ] Events support RSVP, recurring schedules, and calendar export.
- [ ] Real-time chat works for groups, DMs, and events with inline sighting cards.
- [ ] Event reminder emails send on schedule.

### Verification

- [ ] Integration tests for feed composition, follow system, and inline confirmation.
- [ ] Integration tests for group CRUD, membership, and admin capabilities.
- [ ] Integration tests for event CRUD, RSVP, recurrence, and post-event aggregation.
- [ ] WebSocket integration tests for real-time chat message delivery and Valkey pub/sub fan-out.
- [ ] Email delivery tests for event reminders.
- [ ] Playwright coverage for feed browsing, group creation, event RSVP, and chat messaging.

## Phase 6 - Challenges, badges, leaderboards, and stats dashboard

### Objectives

- [ ] Drive daily engagement and long-term retention through gamification.
- [ ] Make the stats dashboard as addictive for birders as Strava is for runners.
- [ ] Keep all stats precomputed and fast.

### Checklist

- [ ] Implement `challenges`, `challenge_progress`, and `badges` tables.
- [ ] Implement `user_stats`, `life_list`, `leaderboards`, and `leaderboard_entries` tables.
- [ ] Build monthly, yearly, seasonal, and one-time challenge types with configurable goals.
- [ ] Implement badge and achievement system: checklist milestones, life list milestones, Early Bird, Night Owl, streak badges, social badges, taxonomy badges, photography badges.
- [ ] Build challenge progress evaluation via BullMQ scheduled jobs.
- [ ] Build leaderboards: weekly, monthly, yearly, all-time, scoped by global/state/county/group.
- [ ] Precompute leaderboard data via BullMQ jobs and cache in Valkey sorted sets.
- [ ] Build the personal stats dashboard at `/app/profile` with D3 visualizations: life list growth chart, year list bar chart, county map (interactive, zoomable, colored by species count), total checklists, most-seen species, rarest species, streaks, seasonal activity heatmap (GitHub-contribution style), species accumulation curve, badge showcase with @vueuse/motion entrance animations, leaderboard positions.
- [ ] Build county/state/park completion map that fills in with color as users bird new areas.
- [ ] Implement life list tracking with first-seen date, location, checklist reference, and photo.
- [ ] Build year list tracking with monthly breakdown.
- [ ] Implement streak tracking (current and longest).
- [ ] Add BullMQ scheduled job for periodic stats recomputation.
- [ ] Add Zod schemas for challenge, badge, leaderboard, stats, and life list payloads.

### Exit criteria

- [ ] Challenges track progress and award badges on completion.
- [ ] Leaderboards load instantly from precomputed Valkey data.
- [ ] The stats dashboard renders all D3 visualizations correctly.
- [ ] County/state map fills in as users bird new areas.
- [ ] Life list and year list tracking are accurate and durable.
- [ ] Streaks update correctly on each birding day.

### Verification

- [ ] Integration tests for challenge progress evaluation across all goal types.
- [ ] Integration tests for badge award logic and edge cases.
- [ ] Leaderboard computation and ranking tests.
- [ ] D3 visualization rendering tests for all chart types.
- [ ] Stats accuracy tests: life list count, year list count, streak calculation, county count.
- [ ] Playwright coverage for stats dashboard, challenge progress, and leaderboard browsing.

## Phase 7 - Trip planner, weather, tides, and intelligence features

### Objectives

- [ ] Turn Pish from a tool into a birding companion that tells you where to go and when.
- [ ] Build trip planning that is smarter than manually checking eBird hotspots.
- [ ] Deliver the "you should go here tomorrow" nudge that serious birders dream about.

### Checklist

- [ ] Implement `trips`, `trip_stops`, `routes`, `route_waypoints`, and `route_ratings` tables.
- [ ] Build smart trip planner: pick a date, region, and optional target species; generate optimized route using eBird hotspot data (recent activity, frequency for time of year), weather forecast, tide data for coastal spots, and user's life list (prioritize lifer opportunities).
- [ ] Build manual trip builder: add stops, reorder with drag and drop, set estimated time per stop, calculate drive times between stops.
- [ ] Build community routes: users create and share named routes, others follow, rate, and review.
- [ ] Build route rating and review system with average rating and usage tracking.
- [ ] Implement "best time to visit" predictions for hotspots based on frequency data and seasonal patterns.
- [ ] Implement personalized nudges: "You should go to [hotspot] tomorrow. [Tide condition] and [target species] was confirmed there yesterday, which you need for your life list."
- [ ] Implement cold front and fallout condition alerts as high-value push notifications.
- [ ] Add Zod schemas for trip, route, waypoint, rating, and nudge payloads.

### Exit criteria

- [ ] Smart trip planner generates optimized multi-stop routes using real data.
- [ ] Manual trip builder allows full customization with drive time estimates.
- [ ] Community routes can be created, shared, rated, and reviewed.
- [ ] Personalized nudges fire based on life list gaps, nearby recent sightings, and conditions.
- [ ] Cold front alerts reach users before fallout events.

### Verification

- [ ] Integration tests for trip route optimization logic.
- [ ] Integration tests for community route CRUD, rating, and ranking.
- [ ] Nudge generation tests for life list gap detection and condition matching.
- [ ] Playwright coverage for trip creation, route browsing, and nudge display.

## Phase 8 - Stripe billing and Pish Pro

### Objectives

- [ ] Monetize without paywalling core community features.
- [ ] Use Stripe Checkout and Customer Portal so no custom billing UI is needed.

### Checklist

- [ ] Integrate Stripe Checkout for Pish Pro subscription ($4.99/mo or $39.99/yr).
- [ ] Implement Stripe webhook handler for subscription lifecycle events (created, renewed, cancelled, payment failed).
- [ ] Store `stripe_customer_id`, `subscription_tier`, and `subscription_status` on user records.
- [ ] Implement Stripe Customer Portal link for self-service billing management.
- [ ] Implement entitlement checks: unlimited species alerts (free caps at 5), advanced trip planner, detailed analytics, priority push notifications, custom profile badge, data export, ad-free.
- [ ] Add shared permissions module so both frontend and backend check entitlements consistently.
- [ ] Implement graceful degradation for expired or past-due subscriptions.
- [ ] Add Zod schemas for subscription status and entitlement payloads.

### Exit criteria

- [ ] Users can subscribe to Pish Pro via Stripe Checkout.
- [ ] Subscription state syncs reliably via webhooks.
- [ ] Users can manage billing through Stripe Customer Portal.
- [ ] Pro features are gated correctly. Free features remain fully accessible.
- [ ] Past-due and cancelled states degrade gracefully.

### Verification

- [ ] Integration tests for webhook handling across all subscription lifecycle events.
- [ ] Entitlement check tests for free vs pro feature boundaries.
- [ ] Graceful degradation tests for expired and past-due subscriptions.
- [ ] Playwright coverage for subscribe, manage billing, and entitlement enforcement flows.

## Phase 9 - PWA, offline mode, and push notifications

### Objectives

- [ ] Make the installed PWA experience indistinguishable from a native app.
- [ ] Ensure core features work offline because birders lose signal in the field.
- [ ] Deliver push notifications that birders actually want to receive.

### Checklist

- [ ] Add PWA manifest with icons, splash screen, theme color, and install prompt.
- [ ] Build service worker for offline caching: field guide species data, map tiles for previously viewed areas, BirdNET model, recent feed data.
- [ ] Implement offline checklist creation and editing with sync-on-reconnect.
- [ ] Implement offline sighting report queuing with sync-on-reconnect.
- [ ] Implement Web Push API integration for push notifications.
- [ ] Build notification preferences UI: per species, per location, per alert type, per notification category.
- [ ] Walk new users through notification preference configuration during onboarding.
- [ ] Implement `push_subscriptions` table for Web Push endpoint storage.
- [ ] Implement push notification delivery in alert dispatch BullMQ jobs.
- [ ] Add "Add to Home Screen" prompt logic on first visit.

### Exit criteria

- [ ] The PWA installs and launches with proper icons, splash screen, and theme color.
- [ ] Field guide, map tiles, and sound ID work offline.
- [ ] Checklists and sighting reports created offline sync when connectivity returns.
- [ ] Push notifications deliver for sighting alerts, event reminders, challenge completions, and messages.
- [ ] Users can configure notification preferences granularly.

### Verification

- [ ] Service worker caching tests for field guide, map tiles, and feed data.
- [ ] Offline checklist creation and sync-on-reconnect tests.
- [ ] Offline sighting report queuing and sync tests.
- [ ] Push notification delivery tests across notification categories.
- [ ] PWA manifest validation and install prompt tests.
- [ ] Playwright coverage for offline workflows and notification preference configuration.

## Phase 10 - Admin panel, moderation, and abuse controls

### Objectives

- [ ] Make Pish operable by humans who did not build it.
- [ ] Give moderators the tools they need to keep the community trustworthy.
- [ ] Build the god-mode dashboard for full system visibility.

### Checklist

- [ ] Build admin panel at `/app/admin` with role-gated access (god, admin, regional_mod).
- [ ] Implement user management: search, view, edit roles, ban/unban, impersonate for debugging.
- [ ] Implement sighting moderation queue: flagged sightings, unconfirmed rare sightings awaiting review, false report adjudication.
- [ ] Implement content moderation: reported messages, reported profiles, chat moderation logs.
- [ ] Build analytics dashboard: DAU, WAU, MAU, sightings submitted, checklists logged, events created, growth metrics, retention curves.
- [ ] Implement species taxonomy management: add/edit species, update frequency data from eBird, regional overrides.
- [ ] Implement challenge management: create, edit, archive challenges, monitor participation.
- [ ] Build system health dashboard: Sentry error rates, API response times, WebSocket connection counts, BullMQ queue depths and failure rates, Valkey memory usage, MeiliSearch index health, push notification delivery stats.
- [ ] Implement regional moderator assignment to geographic regions.
- [ ] Add structured logging across all services.

### Exit criteria

- [ ] Admins can manage users, moderate sightings, and view analytics.
- [ ] Regional moderators can manage sightings and users in their assigned regions.
- [ ] The system health dashboard exposes enough data to diagnose problems.
- [ ] Structured logs are queryable across all services.

### Verification

- [ ] Role-gated access tests: god sees everything, admin sees everything except god management, regional_mod sees only their region.
- [ ] Moderation workflow tests for sighting flags, user bans, and false report adjudication.
- [ ] Analytics query tests for DAU, WAU, MAU accuracy.
- [ ] Playwright coverage for admin panel navigation, user management, and moderation queue.

## Phase 11 - Reliability, performance, and UX polish

### Objectives

- [ ] Raise the product from functional to production-grade.
- [ ] Make every interaction feel intentional, fast, and polished.
- [ ] Optimize for thousands of concurrent users.

### Checklist

- [ ] Add comprehensive rate limiting across all endpoint categories: strict for auth, moderate for writes, generous for reads.
- [ ] Tune Valkey caching for hot paths: species data, leaderboards, frequency tables, hotspot data.
- [ ] Tune MeiliSearch index configuration for optimal search relevance and speed.
- [ ] Tune BullMQ concurrency settings and retry policies.
- [ ] Polish reconnect handling for WebSocket connections (chat, live feed).
- [ ] Polish loading states, empty states, error states, and offline messaging across all surfaces.
- [ ] Tune @vueuse/motion animations: buttons, cards, modals, list items, page transitions.
- [ ] Respect `prefers-reduced-motion` globally.
- [ ] Polish map interactions for mobile touch targets and desktop mouse precision.
- [ ] Polish species search autocomplete speed and result quality.
- [ ] Optimize D3 visualizations for mobile viewports.
- [ ] Improve onboarding flow for new users based on early feedback.

### Exit criteria

- [ ] Rate limiting covers all obvious abuse paths.
- [ ] Hot paths load from cache, not from cold database queries.
- [ ] WebSocket reconnect is seamless and does not lose messages.
- [ ] Loading, empty, and error states are clear and consistent.
- [ ] Animations are subtle, fast, and respect accessibility preferences.
- [ ] The product feels production-grade on both mobile and desktop.

### Verification

- [ ] Rate limit tests confirming correct thresholds per endpoint category.
- [ ] Cache hit tests for species data, leaderboards, and frequency tables.
- [ ] WebSocket reconnect and message replay tests.
- [ ] Manual UX review across mobile and desktop breakpoints.
- [ ] Accessibility audit for reduced motion and screen reader support.
- [ ] Abuse-path tests for auth spam, sighting spam, and malformed traffic.

## Phase 12 - Deployment, staging, and launch hardening

### Objectives

- [ ] Make Pish deployable and operable on its intended infrastructure.
- [ ] Prove deploy, backup, restore, and rollback paths before launch.
- [ ] Freeze the v1 feature set and focus on launch-blocking bugs only.

### Checklist

- [ ] Finalize `compose.yaml`, Caddyfile, env contracts, and deployment scripts for production.
- [ ] Configure DNS for getpish.com, api.getpish.com, ws.getpish.com, cdn.getpish.com via Cloudflare.
- [ ] Stand up staging that mirrors production routing.
- [ ] Add PostgreSQL backup automation and restore documentation.
- [ ] Add staging seed flows for realistic test accounts, species data, sightings, groups, and events.
- [ ] Define launch-day runbook: deploy procedure, rollback steps, incident contact expectations.
- [ ] Set explicit initial capacity targets (concurrent users, sightings per minute, WebSocket connections) and verify on the chosen host.
- [ ] Configure Sentry release tracking and alert rules for error spikes and latency regressions.
- [ ] Set up status page at status.getpish.com via Better Stack or Uptime Robot.
- [ ] Freeze the v1 feature set. Close launch-blocking bugs only.

### Exit criteria

- [ ] Staging behaves like production for auth, sightings, alerts, map, feed, chat, and billing.
- [ ] Backup and restore from PostgreSQL is proven.
- [ ] The team can deploy, roll back, and inspect the system without guesswork.
- [ ] Capacity targets are documented and met.
- [ ] Status page monitors health endpoints.

### Verification

- [ ] Full staging deployment from clean infrastructure.
- [ ] Backup and restore drill against staging.
- [ ] Load tests for target concurrency: sighting submissions, alert fan-out, WebSocket connections, search queries, BullMQ job throughput.
- [ ] Full `bun run verify` and Playwright suite against staging.
- [ ] Rollback drill: deploy, break something, roll back, confirm recovery.

## Phase 13 - Launch and immediate post-launch follow-through

### Objectives

- [ ] Launch getpish.com with a narrow, polished feature set targeting SW Florida birders.
- [ ] Measure real user behavior and update assumptions with what reality says.
- [ ] Triage real user pain immediately.

### Checklist

- [ ] Launch the service with the agreed v1 scope.
- [ ] Monitor Sentry errors, BullMQ queue health, WebSocket stability, alert dispatch latency, and search performance closely.
- [ ] Triage real user pain quickly: broken flows, confusing UX, missing species, incorrect frequency data.
- [ ] Convert launch assumptions into measured facts: which features get used, where users drop off, what alerts actually get tapped.
- [ ] Open a post-launch backlog for deferred features and improvements.
- [ ] Collect and prioritize early user feedback from the SW Florida birding community.

### Exit criteria

- [ ] Real users can register, report sightings, receive alerts, browse the field guide, run checklists, join groups, attend events, chat, track stats, and manage billing without operator intervention.
- [ ] The service survives normal traffic and ordinary network instability.
- [ ] The operational team has enough telemetry to know what is happening.

### Verification

- [ ] Review launch-day metrics and error logs.
- [ ] Confirm successful new-user registration and onboarding completion.
- [ ] Confirm sighting reports, confirmation thresholds, and alert dispatch work correctly in production.
- [ ] Confirm checklist creation, sound ID, and eBird sync work correctly in production.
- [ ] Confirm group, event, and chat features work correctly in production.
- [ ] Confirm Stripe billing and subscription management work correctly in production.
- [ ] Document every material incident and mitigation.

## Cross-phase verification gates

- [ ] Every completed phase leaves the repo in a buildable, testable state.
- [ ] The root `bun run verify` command stays current with implemented reality.
- [ ] Unit tests must cover sighting confirmation logic, rarity classification, trust scores, alert dispatch, and stats computation.
- [ ] Integration tests must cover database writes, auth, sighting flow, alert fan-out, chat delivery, challenge evaluation, billing webhooks, and search indexing.
- [ ] Playwright must cover core user journeys from sign up through sighting report, checklist, feed, and stats review.
- [ ] Load testing must cover sighting bursts, alert fan-out, WebSocket connections, MeiliSearch queries, and BullMQ throughput before launch.
- [ ] Every production bug in confirmation logic, rarity classification, alert dispatch, or stats calculation should add a regression test.

## Definition of done for any completed phase

- [x] Completed phases update code, tests, docs, and env guidance together.
- [x] Completed phases satisfy their exit criteria.
- [x] Completed phases have verification expectations checked honestly.
- [x] Completed phases update this file at the same time as the repo change.

## When to retire this file

- [ ] Keep `BUILD.md` while Pish is in active greenfield build mode.
- [ ] Once the repo graduates from greenfield, fold current truth into stable docs such as `README.md`, `docs/architecture.md`, `docs/operations.md`, and `docs/development.md`.
- [ ] Remove stale checklist history instead of letting this file become dead weight.
