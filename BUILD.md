# BUILD.md

> **Required operating rule:** any agent who completes work from this plan, changes scope, or learns repo truth that affects sequencing must update this file in the same change set. Keep the checkboxes honest. Do not mark boxes complete unless the repo already proves them.

Pish is in active greenfield build mode. This file is the execution authority for taking the repo from an empty shell to a launched birding platform.

Pish is the all-in-one birding platform that replaces five apps with one. It combines real-time bird sound identification, a visual field guide, crowd-confirmed sighting alerts, social community features, trip planning, gamification, and personal stats into a single native iOS app with a Vapor backend. Think Strava meets eBird meets Merlin, built for the modern birder who wants community, not just a checklist.

## Current repo truth

- [ ] The repo contains a Swift Package Manager monorepo with `PishApp` (iOS/macOS), `PishAPI` (Vapor backend), and shared `PishKit` library.
- [ ] SwiftUI owns the entire native UI surface for iOS and macOS.
- [ ] Vapor serves the API surface.
- [ ] PostgreSQL, PostGIS, Valkey, MeiliSearch, and Caddy are wired through `compose.yaml` for the backend.
- [ ] Shared models and validation live in `PishKit`.
- [ ] The local backend entrypoint is `swift run PishAPI serve` or `docker compose up`.
- [ ] Auth, sessions, and protected routes are implemented.
- [ ] Species taxonomy and eBird data sync are implemented.
- [ ] Sighting reports and crowd-confirmed alert dispatch are implemented.
- [ ] Sound ID and checklists are implemented.
- [ ] Social features (groups, events, chat, feed) are implemented.
- [ ] Challenges, badges, leaderboards, and stats dashboard are implemented.
- [ ] Trip planner and Stripe billing are implemented.
- [ ] Admin tools and moderation are implemented.
- [ ] Offline mode and push notifications are implemented.

## Product guardrails

- [ ] Pish is a serious birding platform, not a novelty app.
- [ ] The native iOS app is the primary product surface. macOS support ships via Mac Catalyst or a native macOS target.
- [ ] SwiftUI owns all views. UIKit appears only when SwiftUI has no viable path for a specific interaction.
- [ ] Vapor owns the backend API. All client-server communication goes through typed REST endpoints with Codable contracts.
- [ ] PostgreSQL with PostGIS is the durable system of record.
- [ ] Valkey owns the fast layer: sessions, caching, rate limiting, pub/sub, sorted sets.
- [ ] Vapor Queues with Redis driver handles all background work: alerts, sync, media, email, stats, search indexing.
- [ ] MeiliSearch powers species, user, and hotspot search.
- [ ] Auth, confirmation thresholds, trust scores, and rarity classification are correctness problems first.
- [ ] The sighting confirmation and alert system is the killer feature. It must be trustworthy and fast.
- [ ] Alerts are never algorithmic. Chronological feed. No engagement manipulation.
- [ ] eBird is respected, not replaced. Pish syncs to eBird, not away from it.
- [ ] Launch scope is SW Florida dogfood-ready, not global-scale-on-day-one.
- [ ] Core community features are never paywalled. Network effects depend on free access.
- [ ] Offline capability is non-negotiable. Birders lose signal in the field.
- [ ] Abuse controls and trust mechanics are part of launch quality, not post-launch debt.

## Stack

- **Swift** across iOS app, macOS app, backend API, shared models, and CLI tools
- **Swift Package Manager** for all dependency management and project structure
- **SwiftUI** for the entire native UI on iOS and macOS
- **SwiftUI Charts** for stats visualizations, frequency charts, and accumulation curves
- **MapKit** for maps, annotations, overlays, and geospatial UI
- **Core Location** for GPS positioning and geofencing
- **AVFoundation** for audio recording, playback, and microphone streaming
- **Core ML / Create ML** for on-device BirdNET bird sound inference
- **Vapor** for the backend HTTP API and WebSocket endpoints
- **Fluent ORM** with PostgreSQL driver and PostGIS support for geospatial queries
- **PostgreSQL** with **PostGIS** for the durable data layer
- **Valkey** via **RediStack** for caching, sessions, rate limiting, pub/sub, sorted sets
- **Vapor Queues** with Redis driver for background jobs
- **JWT + Vapor sessions** for auth (email/password + Sign in with Apple + Google OAuth)
- **MeiliSearch** via Swift client for species, user, and hotspot search
- **Stripe** via Swift SDK or direct API integration for Pish Pro subscriptions
- **APNs** (Apple Push Notification service) for push notifications
- **CloudKit** or custom sync for offline data persistence and sync-on-reconnect
- **Swift Argument Parser** for CLI tools (migrations, seed scripts, admin utilities)
- **Sentry Swift SDK** for error tracking and performance monitoring on client and server
- **swift-image** or ImageMagick bindings for server-side image processing
- **Resend** HTTP API for transactional email
- **Docker Compose** for backend service orchestration and deployment
- **Caddy** for TLS termination, reverse proxy, and compression on the backend
- **SwiftLint** for code style enforcement
- **Xcode** for app builds, testing, and distribution
- **XCTest** and **Swift Testing** for unit and integration tests
- **Xcode UI Tests** for end-to-end app testing

## Phase status summary

- [ ] Phase 0 - Product framing and repo bootstrap.
- [ ] Phase 1 - Database foundation, auth, and species data.
- [ ] Phase 2 - Sighting reports, confirmation system, and alert dispatch.
- [ ] Phase 3 - Map, field guide, and core navigation.
- [ ] Phase 4 - Checklists, sound ID, and field tools.
- [ ] Phase 5 - Social feed, groups, events, and chat.
- [ ] Phase 6 - Challenges, badges, leaderboards, and stats dashboard.
- [ ] Phase 7 - Trip planner, weather, tides, and intelligence features.
- [ ] Phase 8 - Stripe billing and Pish Pro.
- [ ] Phase 9 - Offline mode and push notifications.
- [ ] Phase 10 - Admin panel, moderation, and abuse controls.
- [ ] Phase 11 - Reliability, performance, and UX polish.
- [ ] Phase 12 - Deployment, staging, and launch hardening.
- [ ] Phase 13 - Launch and immediate post-launch follow-through.

## Phase 0 - Product framing and repo bootstrap

### Objectives

- [ ] Create the Swift Package Manager monorepo and Xcode project structure.
- [ ] Stand up the full local development environment for both app and backend.
- [ ] Prove that all services boot and talk to each other before feature work begins.

### Checklist

- [ ] Create root `Package.swift` with targets: `PishApp` (iOS/macOS SwiftUI app), `PishAPI` (Vapor backend), `PishKit` (shared models, validation, and contracts), `PishCLI` (admin and migration tools).
- [ ] Create the Xcode project for `PishApp` with iOS and macOS targets, app icons, launch screen, and Info.plist configuration.
- [ ] Add `PishApp` SwiftUI scaffolding with `@main` App struct, tab-based navigation, and placeholder views for Map, Feed, Field Guide, Profile, and Settings.
- [ ] Add `PishAPI` Vapor scaffolding with health and readiness endpoints, `configure.swift`, and `routes.swift`.
- [ ] Add `PishKit` with initial shared Codable models and validation logic.
- [ ] Add `PishCLI` with Swift Argument Parser scaffolding for migration and seed commands.
- [ ] Add `db/migrations/` directory and Fluent migration infrastructure.
- [ ] Add `compose.yaml` for `caddy`, `api`, `postgres` (with PostGIS), `valkey`, and `meilisearch`.
- [ ] Add `Caddyfile` for reverse proxying the API and WebSocket services.
- [ ] Add `.env.example` with all service connection strings and API keys.
- [ ] Add `.swiftlint.yml` for code style configuration.
- [ ] Add root-level scripts or `Makefile` for common operations: `make dev`, `make test`, `make lint`, `make build`, `make verify`.
- [ ] Add `README.md` with local setup instructions for both the Xcode project and backend services.
- [ ] Add Xcode UI test target with smoke test scaffolding.
- [ ] Configure Xcode schemes for Debug and Release builds.

### Exit criteria

- [ ] A fresh clone can open the Xcode project, build and run the iOS app in Simulator.
- [ ] `swift build` compiles `PishAPI` and `PishKit` without errors.
- [ ] `docker compose up` starts all backend services with health endpoints reachable.
- [ ] The app connects to the local Vapor API through Caddy.
- [ ] The project structure matches the intended long-term shape.

### Verification

- [ ] `swift build` for all SPM targets.
- [ ] `swift test` runs and passes.
- [ ] `swiftlint` reports no violations.
- [ ] Xcode build succeeds for iOS Simulator and macOS targets.
- [ ] `docker compose up -d --build` with all backend services healthy.

## Phase 1 - Database foundation, auth, and species data

### Objectives

- [ ] Implement the durable user, session, and species data model via Fluent migrations.
- [ ] Establish secure authentication before any feature work.
- [ ] Import eBird taxonomy so species search and frequency data are available from the start.

### Checklist

- [ ] Implement Fluent migrations for `User`, `Session`, `OAuthAccount`, `EmailVerificationToken`, `PasswordResetToken` models with role and permission columns.
- [ ] Enable PostGIS extension via migration and add geospatial column support to Fluent models.
- [ ] Implement sign up, sign in, sign out, and session refresh flows with Vapor middleware.
- [ ] Implement password hashing with Bcrypt (Vapor built-in) or Argon2 via a Swift wrapper.
- [ ] Implement Sign in with Apple via Vapor's built-in Apple auth support.
- [ ] Implement Google OAuth flow.
- [ ] Implement email verification flow with Resend HTTP API.
- [ ] Implement password reset flow with time-limited, single-use tokens.
- [ ] Implement `AuthMiddleware` for protected route enforcement and session validation.
- [ ] Add username rules, uniqueness policy, and profile bootstrap flow.
- [ ] Add account-status handling for active, banned, and new_user states.
- [ ] Implement role and permission definitions: god, admin, regional_mod, trusted, user, new_user, banned.
- [ ] Implement `Species` and `SpeciesFrequency` Fluent models.
- [ ] Build eBird taxonomy import command in `PishCLI` and seed the species database.
- [ ] Configure MeiliSearch species index via Swift client with autocomplete, fuzzy matching, and frequency-weighted ranking.
- [ ] Add RediStack integration for session storage and sliding-window rate limiting on auth endpoints.
- [ ] Initialize Sentry Swift SDK in both `PishApp` and `PishAPI`.
- [ ] Add shared Codable models for user, session, species, and auth payloads in `PishKit`.
- [ ] Build the SwiftUI sign up, sign in, and onboarding views in `PishApp`.

### Exit criteria

- [ ] Users can create accounts, sign in, stay signed in with secure server-side sessions, and sign out via the iOS app.
- [ ] Sign in with Apple works end to end on device.
- [ ] Google OAuth sign in works end to end.
- [ ] Email verification and password reset flows work end to end.
- [ ] Protected API routes enforce valid auth via bearer tokens or session cookies.
- [ ] The species database contains the full eBird taxonomy.
- [ ] Species search returns fast, typo-tolerant results from MeiliSearch.
- [ ] Rate limiting is active on auth endpoints.

### Verification

- [ ] Fluent migration up and reset flows against a clean local PostgreSQL instance.
- [ ] Integration tests for auth success, auth failure, session revocation, and protected routes.
- [ ] Integration tests for Sign in with Apple flow.
- [ ] Integration tests for Google OAuth flow.
- [ ] Species search tests against MeiliSearch for autocomplete accuracy and fuzzy matching.
- [ ] Xcode UI tests for sign up, sign in, sign out, and session persistence in the iOS app.
- [ ] Rate limit tests confirming 429 responses after threshold.

## Phase 2 - Sighting reports, confirmation system, and alert dispatch

### Objectives

- [ ] Build the core sighting report flow optimized for speed (under 10 seconds for a practiced user on the native app).
- [ ] Implement crowd-confirmed alert dispatch with trust-weighted confirmation thresholds.
- [ ] Make the alert system trustworthy enough that serious birders rely on it.

### Checklist

- [ ] Implement `Sighting`, `SightingConfirmation`, and `SightingFlag` Fluent models.
- [ ] Implement `UserSpeciesAlert` and `UserLocationAlert` Fluent models.
- [ ] Build sighting report API endpoint: GPS auto-fill from Core Location, species search with MeiliSearch (sorted by frequency for location and month), optional photo/audio attachment, notes.
- [ ] Build the SwiftUI sighting report view: species autocomplete, GPS display, photo/audio capture via camera and AVFoundation, notes field.
- [ ] Implement rarity auto-classification based on eBird frequency data: common (>30%), uncommon (10-30%), rare (1-10%), mega_rare (<1%).
- [ ] Implement confirmation threshold logic: common (no confirmation needed), uncommon (feed only), rare (2 confirmations within 1 mile and 24 hours), mega_rare (2 confirmations OR 1 from trusted/mod).
- [ ] Implement trust-weighted thresholds: trusted reporters need only 1 additional confirmation; new users need 3 for rare+.
- [ ] Implement confirmation submission flow: nearby users can confirm with optional photo evidence.
- [ ] Build Vapor Queues alert dispatch job: fan out APNs push notifications to users with matching species/location alerts within configured radius.
- [ ] Publish confirmed sightings to Valkey pub/sub for real-time WebSocket feed broadcast.
- [ ] Create `Notification` Fluent model and in-app notification delivery.
- [ ] Implement anti-abuse escalation: 3 flagged reports raises threshold, 5 requires mod review, 10 auto-bans pending review.
- [ ] Implement false report count decay (1 per quarter).
- [ ] Implement sighting flagging and moderation resolution flow.
- [ ] Add server-side image processing via swift-image or ImageMagick for sighting photo uploads (thumbnail, HEIC/JPEG conversion, EXIF stripping) dispatched through Vapor Queues.
- [ ] Add shared Codable models for sighting, confirmation, flag, alert, and notification payloads in `PishKit`.

### Exit criteria

- [ ] A user can report a sighting in under 10 seconds with species autocomplete, GPS, and optional media from the native app.
- [ ] Rarity classification is automatic and correct based on eBird frequency data.
- [ ] Rare sightings trigger alerts only after confirmation thresholds are met.
- [ ] Alert dispatch fans out APNs push notifications and in-app notifications to matching subscribers.
- [ ] Anti-abuse escalation works end to end.
- [ ] Photo uploads are processed asynchronously with thumbnails and optimized variants.

### Verification

- [ ] Integration tests for sighting creation, rarity classification, and confirmation threshold logic.
- [ ] Integration tests for alert dispatch fan-out against various alert subscription configurations.
- [ ] Integration tests for trust-weighted confirmation thresholds (trusted reporter, new user, standard user).
- [ ] Anti-abuse escalation tests for flagged report counts and consequences.
- [ ] Image processing pipeline tests for thumbnail generation and format conversion.
- [ ] Xcode UI tests for sighting report flow, confirmation flow, and notification delivery.

## Phase 3 - Map, field guide, and core navigation

### Objectives

- [ ] Build the map as the primary navigation surface. Every other feature connects back to the map.
- [ ] Build the field guide as a built-in species reference that birders actually use in the field.
- [ ] Establish the SwiftUI navigation structure and tab hierarchy for the authenticated app.

### Checklist

- [ ] Build the SwiftUI tab bar with Map, Feed, Field Guide, Profile, and Settings tabs.
- [ ] Build the full-screen MapKit map as the home tab.
- [ ] Implement map annotations: recent sightings (color-coded by rarity, solid=confirmed, hollow=unconfirmed), eBird hotspots, user checklists, events, heatmap overlay.
- [ ] Implement "What's near me" quick view: recent sightings within configurable radius using Core Location.
- [ ] Implement tap interactions: sighting annotation details (species, observer, confirmation status, photo), hotspot details (recent species, frequency data, tips), event details (RSVP).
- [ ] Implement PostGIS radius queries for "near me" and location-based sighting/hotspot lookup via Vapor API.
- [ ] Build field guide tab with species search (MeiliSearch via API), species list, and "Likely here now" list.
- [ ] Build species detail view: common and scientific name, family, photos, audio playback via AVFoundation, range map overlay on MapKit, SwiftUI Charts monthly frequency chart, habitat, field marks, similar species, personal history (first sighting, total sightings, user photos).
- [ ] Implement "Likely here now" logic: Core Location coordinates + eBird frequency data + current month, sorted by frequency.
- [ ] Build the authenticated dashboard view as the initial view for signed-in users (or integrate into the Map tab).
- [ ] Build a SwiftUI design system: color tokens, typography scale, shared component modifiers, and reusable view components.
- [ ] Implement adaptive layouts for iPhone (compact) and iPad/Mac (regular) size classes.

### Exit criteria

- [ ] The map renders with sighting annotations, hotspot markers, and event pins.
- [ ] Tapping a sighting annotation shows species, observer, confirmation status, and photo.
- [ ] "What's near me" returns recent sightings within the user's radius using PostGIS.
- [ ] The field guide displays species detail views with frequency data, photos, and audio.
- [ ] "Likely here now" returns species sorted by frequency for the user's current location and month.
- [ ] The tab-based navigation is clear with SwiftUI-native transitions.
- [ ] iPhone and iPad/Mac layouts are both usable.

### Verification

- [ ] PostGIS radius query tests for sighting and hotspot proximity search.
- [ ] MeiliSearch species search tests for autocomplete and frequency-weighted ranking.
- [ ] SwiftUI Charts frequency chart rendering tests via snapshot tests or preview verification.
- [ ] Xcode UI tests for map interactions, field guide browsing, and species detail navigation.
- [ ] Adaptive layout checks at iPhone, iPad, and Mac size classes.

## Phase 4 - Checklists, sound ID, and field tools

### Objectives

- [ ] Make Pish a legitimate replacement for carrying Merlin, BirdNET, and Sibley separately.
- [ ] Build checklists that respect scientific data standards (complete vs incomplete).
- [ ] Integrate BirdNET via Core ML for real-time on-device bird sound identification.

### Checklist

- [ ] Implement `Checklist` and `ChecklistEntry` Fluent models.
- [ ] Build checklist start flow in SwiftUI: set location (auto-GPS via Core Location or manual map pin), type (stationary/traveling/incidental), start time.
- [ ] Build species add flow within active checklist: species search, sound ID quick-add, "likely species" quick-add list.
- [ ] Build checklist end flow: end time, distance (if traveling, via Core Location tracking), completeness toggle with clear explanation of scientific value.
- [ ] Implement "Send to eBird" deep-link with pre-populated species list, counts, location, time, distance, completeness.
- [ ] Track eBird sync status per checklist.
- [ ] Convert BirdNET model to Core ML format and bundle with the app.
- [ ] Build "Live listen" mode: continuous AVFoundation microphone streaming, real-time Core ML inference with species identification and confidence scores, one-tap add to checklist.
- [ ] Build "Recording analysis" mode: record clip via AVFoundation, run Core ML inference, display identification with confidence score and spectrogram visualization.
- [ ] Implement server-side BirdNET inference fallback endpoint in Vapor for edge cases or older devices.
- [ ] Allow sound ID results to be attached to sighting reports as supporting evidence.
- [ ] Add weather data integration: current conditions and 3-day forecast for any birding location via OpenWeatherMap API.
- [ ] Implement cold front detection and fallout condition alerts via Vapor Queues scheduled weather polling.
- [ ] Add tide data integration: NOAA tide predictions for coastal locations.
- [ ] Implement weather and tide overlays on the MapKit map.
- [ ] Factor tide data into trip planning and hotspot recommendations.
- [ ] Add shared Codable models for checklist, checklist entry, sound ID result, weather, and tide payloads in `PishKit`.

### Exit criteria

- [ ] A user can start a checklist, add species, and end it with correct metadata from the native app.
- [ ] The completeness toggle is prominently explained to new users.
- [ ] eBird sync deep-link pre-populates correctly.
- [ ] Sound ID identifies bird calls in real time with confidence scores via on-device Core ML.
- [ ] Server-side inference fallback works for edge cases.
- [ ] Weather conditions and tide data display for birding locations.
- [ ] Cold front alerts fire when fallout conditions are likely.

### Verification

- [ ] Integration tests for checklist CRUD, entry management, and eBird sync status tracking.
- [ ] Sound ID accuracy tests against known bird call samples using Core ML model.
- [ ] Core ML inference performance tests on target devices.
- [ ] Server-side inference fallback tests.
- [ ] Weather and tide data integration tests.
- [ ] Cold front detection logic tests.
- [ ] Xcode UI tests for checklist creation, species add, end, and eBird sync flows.
- [ ] Xcode UI tests for sound ID live listen and recording analysis modes.

## Phase 5 - Social feed, groups, events, and chat

### Objectives

- [ ] Build the community layer that differentiates Pish from existing tools.
- [ ] Make the feed chronological and trustworthy. Never algorithmic.
- [ ] Give local birding clubs one place to coordinate everything.

### Checklist

- [ ] Build the chronological social feed in the Feed tab: sightings from followed users, confirmed rare alerts, group activity, event listings, challenge completions.
- [ ] Implement follow system between users.
- [ ] Implement like and comment on sightings with @mention support triggering notifications.
- [ ] Implement inline "Confirm" button on feed sighting cards.
- [ ] Implement `Group` and `GroupMember` Fluent models.
- [ ] Build group creation, join, and management flows in SwiftUI: geographic, interest, club types.
- [ ] Build group detail views with feed, event calendar, group chat, shared species list, and member directory.
- [ ] Implement group admin capabilities: pinned announcements, moderation, event creation.
- [ ] Implement `Event` and `EventRSVP` Fluent models.
- [ ] Build event creation flow in SwiftUI: title, description, location (map pin via MapKit), date/time, duration, difficulty, max attendees, what to bring, target species, event type.
- [ ] Build RSVP system: Going / Interested / Not Going with attendee list and ICS calendar export (via EventKit integration).
- [ ] Implement recurring events with configurable recurrence rules.
- [ ] Build post-event combined species checklist and group photo gallery.
- [ ] Implement event reminder push notifications via APNs dispatched through Vapor Queues.
- [ ] Implement `Message` Fluent model for group, DM, and event chat.
- [ ] Build real-time group chat via Vapor WebSocket endpoints backed by Valkey pub/sub.
- [ ] Build direct message 1-on-1 chat.
- [ ] Build event chat channels (active 24 hours before to 24 hours after event).
- [ ] Support sharing sighting links, photos, and location pins in chat with inline sighting cards.
- [ ] Add shared Codable models for feed, group, event, RSVP, message, and chat payloads in `PishKit`.

### Exit criteria

- [ ] The feed is strictly chronological and shows relevant sightings, alerts, group activity, and events.
- [ ] Users can follow others and see their sightings in the feed.
- [ ] Groups function as full community hubs with feed, events, chat, and member management.
- [ ] Events support RSVP, recurring schedules, and calendar export via EventKit.
- [ ] Real-time chat works for groups, DMs, and events with inline sighting cards.
- [ ] Event reminder push notifications send on schedule via APNs.

### Verification

- [ ] Integration tests for feed composition, follow system, and inline confirmation.
- [ ] Integration tests for group CRUD, membership, and admin capabilities.
- [ ] Integration tests for event CRUD, RSVP, recurrence, and post-event aggregation.
- [ ] WebSocket integration tests for real-time chat message delivery and Valkey pub/sub fan-out.
- [ ] APNs delivery tests for event reminders.
- [ ] Xcode UI tests for feed browsing, group creation, event RSVP, and chat messaging.

## Phase 6 - Challenges, badges, leaderboards, and stats dashboard

### Objectives

- [ ] Drive daily engagement and long-term retention through gamification.
- [ ] Make the stats dashboard as addictive for birders as Strava is for runners.
- [ ] Keep all stats precomputed and fast.

### Checklist

- [ ] Implement `Challenge`, `ChallengeProgress`, and `Badge` Fluent models.
- [ ] Implement `UserStats`, `LifeList`, `Leaderboard`, and `LeaderboardEntry` Fluent models.
- [ ] Build monthly, yearly, seasonal, and one-time challenge types with configurable goals.
- [ ] Implement badge and achievement system: checklist milestones, life list milestones, Early Bird, Night Owl, streak badges, social badges, taxonomy badges, photography badges.
- [ ] Build challenge progress evaluation via Vapor Queues scheduled jobs.
- [ ] Build leaderboards: weekly, monthly, yearly, all-time, scoped by global/state/county/group.
- [ ] Precompute leaderboard data via Vapor Queues jobs and cache in Valkey sorted sets via RediStack.
- [ ] Build the personal stats dashboard in the Profile tab with SwiftUI Charts visualizations: life list growth chart, year list bar chart, county map (interactive MapKit overlay, colored by species count), total checklists, most-seen species, rarest species, streaks, seasonal activity heatmap (contribution-grid style), species accumulation curve, badge showcase with SwiftUI animations.
- [ ] Build county/state/park completion map overlay on MapKit that fills in with color as users bird new areas.
- [ ] Implement life list tracking with first-seen date, location, checklist reference, and photo.
- [ ] Build year list tracking with monthly breakdown.
- [ ] Implement streak tracking (current and longest).
- [ ] Add Vapor Queues scheduled job for periodic stats recomputation.
- [ ] Add shared Codable models for challenge, badge, leaderboard, stats, and life list payloads in `PishKit`.

### Exit criteria

- [ ] Challenges track progress and award badges on completion.
- [ ] Leaderboards load instantly from precomputed Valkey data.
- [ ] The stats dashboard renders all SwiftUI Charts visualizations correctly.
- [ ] County/state map fills in as users bird new areas on the MapKit overlay.
- [ ] Life list and year list tracking are accurate and durable.
- [ ] Streaks update correctly on each birding day.

### Verification

- [ ] Integration tests for challenge progress evaluation across all goal types.
- [ ] Integration tests for badge award logic and edge cases.
- [ ] Leaderboard computation and ranking tests.
- [ ] SwiftUI Charts visualization snapshot tests or preview verification for all chart types.
- [ ] Stats accuracy tests: life list count, year list count, streak calculation, county count.
- [ ] Xcode UI tests for stats dashboard, challenge progress, and leaderboard browsing.

## Phase 7 - Trip planner, weather, tides, and intelligence features

### Objectives

- [ ] Turn Pish from a tool into a birding companion that tells you where to go and when.
- [ ] Build trip planning that is smarter than manually checking eBird hotspots.
- [ ] Deliver the "you should go here tomorrow" nudge that serious birders dream about.

### Checklist

- [ ] Implement `Trip`, `TripStop`, `Route`, `RouteWaypoint`, and `RouteRating` Fluent models.
- [ ] Build smart trip planner: pick a date, region, and optional target species; generate optimized route using eBird hotspot data (recent activity, frequency for time of year), weather forecast, tide data for coastal spots, and user's life list (prioritize lifer opportunities).
- [ ] Build manual trip builder in SwiftUI: add stops on MapKit, reorder with drag and drop, set estimated time per stop, calculate drive times between stops via MapKit directions.
- [ ] Build community routes: users create and share named routes, others follow, rate, and review.
- [ ] Build route rating and review system with average rating and usage tracking.
- [ ] Implement "best time to visit" predictions for hotspots based on frequency data and seasonal patterns.
- [ ] Implement personalized nudges via APNs: "You should go to [hotspot] tomorrow. [Tide condition] and [target species] was confirmed there yesterday, which you need for your life list."
- [ ] Implement cold front and fallout condition alerts as high-value push notifications via APNs.
- [ ] Add shared Codable models for trip, route, waypoint, rating, and nudge payloads in `PishKit`.

### Exit criteria

- [ ] Smart trip planner generates optimized multi-stop routes using real data.
- [ ] Manual trip builder allows full customization with drive time estimates via MapKit.
- [ ] Community routes can be created, shared, rated, and reviewed.
- [ ] Personalized nudges fire based on life list gaps, nearby recent sightings, and conditions.
- [ ] Cold front alerts reach users before fallout events via APNs.

### Verification

- [ ] Integration tests for trip route optimization logic.
- [ ] Integration tests for community route CRUD, rating, and ranking.
- [ ] Nudge generation tests for life list gap detection and condition matching.
- [ ] Xcode UI tests for trip creation, route browsing, and nudge display.

## Phase 8 - Stripe billing and Pish Pro

### Objectives

- [ ] Monetize without paywalling core community features.
- [ ] Use Stripe Checkout (via SFSafariViewController or in-app browser) and Customer Portal so no custom billing UI is needed. Alternatively, use StoreKit 2 for in-app purchases if the App Store is the distribution channel.

### Checklist

- [ ] Evaluate distribution strategy: direct Stripe integration (enterprise/web signup) vs StoreKit 2 in-app purchases vs hybrid approach.
- [ ] Implement Pish Pro subscription ($4.99/mo or $39.99/yr) via chosen billing path.
- [ ] If using Stripe: implement webhook handler in Vapor for subscription lifecycle events (created, renewed, cancelled, payment failed).
- [ ] If using StoreKit 2: implement `StoreKit.Transaction` listener and server-side receipt validation in Vapor.
- [ ] Store subscription tier and status on user records via Fluent model.
- [ ] Implement self-service billing management (Stripe Customer Portal via SFSafariViewController or iOS Settings subscription management).
- [ ] Implement entitlement checks: unlimited species alerts (free caps at 5), advanced trip planner, detailed analytics, priority push notifications, custom profile badge, data export, ad-free.
- [ ] Add shared permissions module in `PishKit` so both app and API check entitlements consistently.
- [ ] Implement graceful degradation for expired or past-due subscriptions.
- [ ] Add shared Codable models for subscription status and entitlement payloads in `PishKit`.

### Exit criteria

- [ ] Users can subscribe to Pish Pro through the app.
- [ ] Subscription state syncs reliably between the billing provider and the backend.
- [ ] Users can manage billing through the appropriate self-service path.
- [ ] Pro features are gated correctly. Free features remain fully accessible.
- [ ] Past-due and cancelled states degrade gracefully.

### Verification

- [ ] Integration tests for subscription lifecycle handling (Stripe webhooks or StoreKit transaction events).
- [ ] Entitlement check tests for free vs pro feature boundaries.
- [ ] Graceful degradation tests for expired and past-due subscriptions.
- [ ] Xcode UI tests for subscribe, manage billing, and entitlement enforcement flows.

## Phase 9 - Offline mode and push notifications

### Objectives

- [ ] Ensure core features work offline because birders lose signal in the field.
- [ ] Deliver push notifications that birders actually want to receive.
- [ ] Make the offline-to-online sync seamless and conflict-free.

### Checklist

- [ ] Implement local persistence layer using SwiftData or Core Data for offline caching: field guide species data, recently viewed map regions, BirdNET Core ML model (bundled), recent feed data.
- [ ] Implement offline checklist creation and editing with sync-on-reconnect via background URLSession or custom sync engine.
- [ ] Implement offline sighting report queuing with sync-on-reconnect.
- [ ] Evaluate CloudKit for user data sync or implement custom sync with conflict resolution.
- [ ] Implement APNs integration: register device tokens, handle notification payloads, implement notification service extension for rich notifications.
- [ ] Build notification preferences view in SwiftUI: per species, per location, per alert type, per notification category.
- [ ] Walk new users through notification preference configuration during onboarding.
- [ ] Implement `DeviceToken` Fluent model for APNs device token storage.
- [ ] Implement push notification delivery in alert dispatch Vapor Queues jobs via APNs.
- [ ] Implement background app refresh for periodic data sync.

### Exit criteria

- [ ] Field guide, cached map data, and sound ID work offline.
- [ ] Checklists and sighting reports created offline sync when connectivity returns.
- [ ] Push notifications deliver for sighting alerts, event reminders, challenge completions, and messages.
- [ ] Users can configure notification preferences granularly.
- [ ] Background app refresh keeps cached data reasonably current.

### Verification

- [ ] Local persistence tests for field guide data and feed caching.
- [ ] Offline checklist creation and sync-on-reconnect tests.
- [ ] Offline sighting report queuing and sync tests.
- [ ] APNs push notification delivery tests across notification categories.
- [ ] Conflict resolution tests for concurrent offline edits.
- [ ] Xcode UI tests for offline workflows and notification preference configuration.

## Phase 10 - Admin panel, moderation, and abuse controls

### Objectives

- [ ] Make Pish operable by humans who did not build it.
- [ ] Give moderators the tools they need to keep the community trustworthy.
- [ ] Build the admin interface for full system visibility.

### Checklist

- [ ] Build admin section in the app with role-gated access (god, admin, regional_mod). Alternatively, build a lightweight Vapor Leaf web admin panel for desktop moderation.
- [ ] Implement user management: search, view, edit roles, ban/unban, impersonate for debugging.
- [ ] Implement sighting moderation queue: flagged sightings, unconfirmed rare sightings awaiting review, false report adjudication.
- [ ] Implement content moderation: reported messages, reported profiles, chat moderation logs.
- [ ] Build analytics dashboard: DAU, WAU, MAU, sightings submitted, checklists logged, events created, growth metrics, retention curves.
- [ ] Implement species taxonomy management: add/edit species, update frequency data from eBird, regional overrides.
- [ ] Implement challenge management: create, edit, archive challenges, monitor participation.
- [ ] Build system health dashboard: Sentry error rates, API response times, WebSocket connection counts, Vapor Queues depths and failure rates, Valkey memory usage, MeiliSearch index health, APNs delivery stats.
- [ ] Implement regional moderator assignment to geographic regions.
- [ ] Add structured logging across all services using Swift Log.

### Exit criteria

- [ ] Admins can manage users, moderate sightings, and view analytics.
- [ ] Regional moderators can manage sightings and users in their assigned regions.
- [ ] The system health dashboard exposes enough data to diagnose problems.
- [ ] Structured logs are queryable across all services.

### Verification

- [ ] Role-gated access tests: god sees everything, admin sees everything except god management, regional_mod sees only their region.
- [ ] Moderation workflow tests for sighting flags, user bans, and false report adjudication.
- [ ] Analytics query tests for DAU, WAU, MAU accuracy.
- [ ] Xcode UI tests or web admin tests for admin panel navigation, user management, and moderation queue.

## Phase 11 - Reliability, performance, and UX polish

### Objectives

- [ ] Raise the product from functional to production-grade.
- [ ] Make every interaction feel intentional, fast, and polished.
- [ ] Optimize for thousands of concurrent users on the backend and buttery-smooth 60fps on the client.

### Checklist

- [ ] Add comprehensive rate limiting across all API endpoint categories: strict for auth, moderate for writes, generous for reads.
- [ ] Tune Valkey caching for hot paths: species data, leaderboards, frequency tables, hotspot data.
- [ ] Tune MeiliSearch index configuration for optimal search relevance and speed.
- [ ] Tune Vapor Queues concurrency settings and retry policies.
- [ ] Polish WebSocket reconnect handling for chat and live feed.
- [ ] Polish SwiftUI loading states, empty states, error states, and offline messaging across all views.
- [ ] Tune SwiftUI animations: button feedback, card transitions, modal presentations, list item animations, tab transitions.
- [ ] Respect iOS accessibility settings: Dynamic Type, Reduce Motion, VoiceOver, Bold Text.
- [ ] Polish map interactions for iPhone touch targets and iPad/Mac pointer precision.
- [ ] Polish species search autocomplete speed and result quality.
- [ ] Optimize SwiftUI Charts visualizations for iPhone viewports.
- [ ] Improve onboarding flow for new users based on early TestFlight feedback.
- [ ] Profile and optimize app launch time, memory usage, and battery consumption.

### Exit criteria

- [ ] Rate limiting covers all obvious abuse paths.
- [ ] Hot paths load from cache, not from cold database queries.
- [ ] WebSocket reconnect is seamless and does not lose messages.
- [ ] Loading, empty, and error states are clear and consistent.
- [ ] Animations are subtle, fast, and respect accessibility preferences.
- [ ] The product feels production-grade on iPhone, iPad, and Mac.
- [ ] App launch time, memory, and battery usage are within acceptable bounds.

### Verification

- [ ] Rate limit tests confirming correct thresholds per endpoint category.
- [ ] Cache hit tests for species data, leaderboards, and frequency tables.
- [ ] WebSocket reconnect and message replay tests.
- [ ] Manual UX review across iPhone, iPad, and Mac.
- [ ] Accessibility audit for Dynamic Type, Reduce Motion, VoiceOver, and Bold Text.
- [ ] Abuse-path tests for auth spam, sighting spam, and malformed traffic.
- [ ] Instruments profiling for launch time, memory, and energy usage.

## Phase 12 - Deployment, staging, and launch hardening

### Objectives

- [ ] Make the Vapor backend deployable and operable on its intended infrastructure.
- [ ] Submit the iOS app to App Store Connect and pass App Review.
- [ ] Prove deploy, backup, restore, and rollback paths before launch.
- [ ] Freeze the v1 feature set and focus on launch-blocking bugs only.

### Checklist

- [ ] Finalize `compose.yaml`, `Dockerfile` for Vapor, Caddyfile, env contracts, and deployment scripts for production backend.
- [ ] Configure DNS for api.getpish.com, ws.getpish.com, cdn.getpish.com via Cloudflare.
- [ ] Stand up staging backend that mirrors production routing.
- [ ] Add PostgreSQL backup automation and restore documentation.
- [ ] Add staging seed flows for realistic test accounts, species data, sightings, groups, and events.
- [ ] Prepare App Store Connect listing: screenshots, description, keywords, privacy policy, app category.
- [ ] Configure TestFlight for beta distribution to SW Florida birding community testers.
- [ ] Submit app for App Store Review.
- [ ] Define launch-day runbook: backend deploy procedure, rollback steps, App Store release timing, incident contact expectations.
- [ ] Set explicit initial capacity targets (concurrent users, sightings per minute, WebSocket connections) and verify on the chosen backend host.
- [ ] Configure Sentry release tracking and alert rules for error spikes and latency regressions on both client and server.
- [ ] Set up status page at status.getpish.com via Better Stack or Uptime Robot.
- [ ] Freeze the v1 feature set. Close launch-blocking bugs only.

### Exit criteria

- [ ] Staging backend behaves like production for auth, sightings, alerts, map, feed, chat, and billing.
- [ ] The iOS app builds, archives, and uploads to App Store Connect cleanly.
- [ ] TestFlight beta is distributed to test users.
- [ ] Backup and restore from PostgreSQL is proven.
- [ ] The team can deploy the backend, roll back, and inspect the system without guesswork.
- [ ] Capacity targets are documented and met.
- [ ] Status page monitors health endpoints.

### Verification

- [ ] Full staging backend deployment from clean infrastructure.
- [ ] Backup and restore drill against staging.
- [ ] Load tests for target concurrency: sighting submissions, alert fan-out, WebSocket connections, search queries, Vapor Queues job throughput.
- [ ] Full `swift test` and Xcode test suite against staging backend.
- [ ] Rollback drill: deploy, break something, roll back, confirm recovery.
- [ ] App Store Review submission and TestFlight beta validation.

## Phase 13 - Launch and immediate post-launch follow-through

### Objectives

- [ ] Launch the Pish iOS app on the App Store targeting SW Florida birders.
- [ ] Measure real user behavior and update assumptions with what reality says.
- [ ] Triage real user pain immediately.

### Checklist

- [ ] Release the app on the App Store with the agreed v1 scope.
- [ ] Monitor Sentry errors (client and server), Vapor Queues health, WebSocket stability, alert dispatch latency, APNs delivery rates, and search performance closely.
- [ ] Triage real user pain quickly: crashes, broken flows, confusing UX, missing species, incorrect frequency data.
- [ ] Convert launch assumptions into measured facts: which features get used, where users drop off, what alerts actually get tapped.
- [ ] Open a post-launch backlog for deferred features and improvements.
- [ ] Collect and prioritize early user feedback from the SW Florida birding community via TestFlight feedback and App Store reviews.

### Exit criteria

- [ ] Real users can download the app, register, report sightings, receive alerts, browse the field guide, run checklists, join groups, attend events, chat, track stats, and manage billing without operator intervention.
- [ ] The backend survives normal traffic and ordinary network instability.
- [ ] The app runs stably on supported iOS versions without excessive crashes or battery drain.
- [ ] The operational team has enough telemetry to know what is happening.

### Verification

- [ ] Review launch-day metrics, crash logs, and error reports.
- [ ] Confirm successful new-user registration and onboarding completion.
- [ ] Confirm sighting reports, confirmation thresholds, and alert dispatch work correctly in production.
- [ ] Confirm checklist creation, sound ID, and eBird sync work correctly in production.
- [ ] Confirm group, event, and chat features work correctly in production.
- [ ] Confirm Stripe/StoreKit billing and subscription management work correctly in production.
- [ ] Confirm APNs push notification delivery rates are acceptable.
- [ ] Document every material incident and mitigation.

## Cross-phase verification gates

- [ ] Every completed phase leaves the repo in a buildable, testable state.
- [ ] The root `make verify` command (or equivalent) stays current with implemented reality.
- [ ] Unit tests must cover sighting confirmation logic, rarity classification, trust scores, alert dispatch, and stats computation.
- [ ] Integration tests must cover database writes, auth, sighting flow, alert fan-out, chat delivery, challenge evaluation, billing lifecycle, and search indexing.
- [ ] Xcode UI tests must cover core user journeys from sign up through sighting report, checklist, feed, and stats review.
- [ ] Load testing must cover sighting bursts, alert fan-out, WebSocket connections, MeiliSearch queries, and Vapor Queues throughput before launch.
- [ ] Every production bug in confirmation logic, rarity classification, alert dispatch, or stats calculation should add a regression test.

## Definition of done for any completed phase

- [ ] Completed phases update code, tests, docs, and env guidance together.
- [ ] Completed phases satisfy their exit criteria.
- [ ] Completed phases have verification expectations checked honestly.
- [ ] Completed phases update this file at the same time as the repo change.

## When to retire this file

- [ ] Keep `BUILD.md` while Pish is in active greenfield build mode.
- [ ] Once the repo graduates from greenfield, fold current truth into stable docs such as `README.md`, `docs/architecture.md`, `docs/operations.md`, and `docs/development.md`.
- [ ] Remove stale checklist history instead of letting this file become dead weight.
