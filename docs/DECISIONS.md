# SENTINEL — Technical Decision Log

Each entry has: date, decision, reason, alternatives considered.

---

## 2026-10-21 — Tailwind CSS v4 (not v3)

**Decision:** Use Tailwind CSS v4 with `@tailwindcss/vite` plugin.

**Reason:** Tailwind v4 is the current stable release. It uses a Vite plugin instead of PostCSS, which is simpler to configure (no `tailwind.config.js` or `postcss.config.js` needed). Design tokens are defined in CSS via `@theme {}`.

**Alternatives considered:**
- Tailwind v3: still supported but entering maintenance mode; v4 is the documented path forward.
- CSS Modules: more verbose for a design-system approach; Tailwind is better for rapid, consistent styling.
- Styled Components / Emotion: runtime CSS-in-JS adds complexity and bundle size; not needed here.

---

## 2026-10-21 — React Router v7 (not v6)

**Decision:** Use React Router v7 (latest stable at time of writing).

**Reason:** v7 is the current release. The data-router (loader/action) pattern was considered but deferred — it adds complexity for a beginner and requires the backend to be connected first. In Milestone 1, simple `<Routes>` + `useEffect` is clearer and easier to understand.

**Alternatives considered:**
- TanStack Router: more type-safe but adds unfamiliar complexity for a beginner project.
- React Router v6: superseded; no reason to use an older version.

---

## 2026-10-21 — React Leaflet v5 + CircleMarker (not default Marker)

**Decision:** Use `CircleMarker` for map markers instead of Leaflet's default `Marker`.

**Reason:** Leaflet's default marker relies on icon image files that Vite's bundler does not serve from the expected path. The standard fix (`delete L.Icon.Default.prototype._getIconUrl`) works but is fragile. `CircleMarker` is a pure-canvas element that needs no image files and is never broken by bundler configuration. It also allows colour-coding by category.

**Alternatives considered:**
- Fixing the default icon path: works, but requires modifying the Leaflet prototype before rendering, which is an anti-pattern and breaks if Leaflet is updated.
- Custom icon with explicit `iconUrl` pointing to a file in `public/`: cleaner than prototype hacking, but still requires maintaining image files. May revisit in Milestone 4 for a better-looking map.

---

## 2026-10-21 — MockApiClient in localStorage (Milestone 1)

**Decision:** Store user-submitted reports in browser `localStorage`, clearly labelled "stored in this browser only".

**Reason:** Allows the full frontend to work without any backend. The `ApiClient` interface ensures pages never import the mock or real client directly — switching to the real backend in Milestone 2 requires changing only `getApiClient()`.

**Alternatives considered:**
- In-memory only (React state): reports disappear on page refresh; bad for testing the Reports list.
- IndexedDB: more capable but unnecessarily complex for a demo store.

---

## 2026-10-21 — SQLite for v1 database (planned, Milestone 2)

**Decision:** Use SQLite via SQLAlchemy for Milestone 2. No Alembic migrations in Milestone 2.

**Reason:** SQLite requires no separate database server, which is ideal for a beginner setup on Windows. SQLAlchemy provides an ORM that makes it easy to switch to PostgreSQL later (Milestone 7). Alembic migrations add significant complexity; for v1 the database schema will be created fresh from the models (`Base.metadata.create_all`). Alembic will be added if/when schema migrations are needed during development.

**Alternatives considered:**
- PostgreSQL from the start: requires a running server; much harder to set up on Windows for a beginner.
- Raw SQL: harder to maintain; no type safety.
- Alembic from Day 1: adds a migration workflow that is confusing for beginners and unnecessary when the schema is still evolving rapidly.

---

## 2026-10-21 — TextSimilarityProvider interface (planned, Milestone 3)

**Decision:** Isolate the embedding model behind a `TextSimilarityProvider` interface with two implementations: `EmbeddingProvider` (Sentence Transformers) and `TFIDFProvider` (scikit-learn, no model download needed).

**Reason:** The app must still run if the Sentence Transformers model (all-MiniLM-L6-v2, ~90 MB) cannot be downloaded or loaded. The TF-IDF fallback gives reduced but real functionality. This also means the app is not locked to any specific model.

**Alternatives considered:**
- Always use embeddings, fail loudly if unavailable: breaks the app in offline or restricted environments.
- OpenAI embeddings API: paid, requires a secret key, violates the "no paid APIs" requirement.

---

## 2026-10-21 — No Docker in v1

**Decision:** Do not use Docker, Kubernetes or any containerisation in v1.

**Reason:** The project is designed for a beginner on Windows using VS Code. Docker adds a significant learning curve and is not necessary for a single-machine development setup. It can be added as an optional Milestone 7 item.

**Alternatives considered:**
- Docker Compose: would simplify the "run both servers" step but adds a new tool to learn.

---

## 2026-10-21 — Geographic clustering method (planned, Milestone 4)

**Decision (tentative):** Use connected-components clustering based on the pair match score, with a cap on cluster size and maximum diameter.

**Reason:** Simple to implement and explain. Reports are linked if their pair match score exceeds the threshold; connected components are then formed from the links. DBSCAN (scikit-learn) is documented as an alternative (uses haversine metric, radius converted to radians).

**Alternatives considered:**
- DBSCAN: well-suited to geographic data, handles noise points well, but requires choosing epsilon (radius) and min_samples; harder to explain to a non-technical audience.
- K-Means: requires knowing k in advance; not suitable for variable-density incident data.

The final choice will be recorded here when Milestone 4 is implemented, with justification based on the evaluation results.

---

## 2026-10-21 — Python 3.14 compatibility note

**Status:** Python 3.14 is installed. For Milestone 2 (FastAPI + SQLAlchemy), 3.14 is likely fine. For Milestone 3 (Sentence Transformers / PyTorch), 3.14 may not yet have compatible binary wheels. This will be verified before Milestone 3 begins; if needed, Python 3.12 will be installed alongside 3.14 and used for the virtual environment.

---

## 2026-10-21 — Production SaaS Visual Design & Lucide Icons

**Decision:** Upgrade visual styling to civic SaaS dashboard standards using `lucide-react` SVG icons, subtle surface elevation, tabular numeric typography, and skeleton loaders.

**Reason:** Replaces raw emoji glyphs with consistent, professional vector symbols. Implements fluid card hover transitions and pulsating status dots for unverified/suspected items, elevating the civic intelligence aesthetic while respecting accessibility and `prefers-reduced-motion`.

**Alternatives considered:**
- Raw inline SVGs: functional but leads to code duplication across components.
- Heroicons: suitable, but Lucide provides a broader set of telemetry and GIS icons (`Compass`, `Waves`, `Flame`, `Radio`).
- Framer Motion: adds bundle overhead; CSS keyframe animations and Tailwind transitions were used instead.

---

## 2026-10-21 — Revert to Standard OpenStreetMap Tiles as Working Default with Graceful Provider Fallback

**Decision:** Set standard OpenStreetMap (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`) as the default tile provider, while providing support for optional English-label providers (CARTO, MapTiler, Stadia) via environment variables (`VITE_MAP_TILE_URL`, `VITE_MAP_ATTRIBUTION`, `VITE_MAP_API_KEY`) and automated fallback.

**Reason:** CARTO updated its basemap access terms to require an API key on all raster and vector endpoints (`basemaps.cartocdn.com`); unauthenticated anonymous requests return HTTP 200 containing an "API KEY REQUIRED · carto.com/basemaps/apikey" watermark. Standard OpenStreetMap is completely open, 100% free, and requires zero registration or API keys. To provide the best experience:
1. **Zero-Setup Default:** OSM standard tiles work out of the box with zero configuration and zero keys.
2. **Proactive Safeguard:** If a user configures a key-requiring provider (such as CARTO, MapTiler, or Stadia) without setting `VITE_MAP_API_KEY`, `resolveTileConfig` automatically diverts to OSM to prevent watermarked tiles.
3. **Reactive Graceful Fallback:** If custom tiles fail to load (e.g. rate limit, bad key, network failure), `SentinelTileLayer` catches the error, switches the active layer to OSM, and presents an informative, dismissible notice.

**Alternatives considered:**
- Mandatory API key for all users: Increases onboarding friction for a beginner developer; violates the zero-credential requirement for out-of-the-box local development.
- Paid tile services (Mapbox, Google Maps): Excluded by project scope ("no paid APIs in v1").
- Static map replacement / screenshot: Violates the requirement for interactive GIS visualization.

---

## 2026-10-21 — Lightweight Animation Architecture (Native CSS + useCountUp)

**Decision:** Implement fluid micro-animations (page transitions, count-up numeric counters, staggered card entrances, and button-press micro-feedback) using native CSS keyframes, utility classes, and a standalone zero-dependency React hook (`useCountUp`), avoiding heavy animation libraries.

**Reason:** Keeps the frontend bundle slim and fast on low-powered mobile devices. Hardware-accelerated CSS animations (`transform`, `opacity`) execute on the compositor thread. Accessibility is guaranteed via `@media (prefers-reduced-motion: reduce)` which zeroes out all animation durations and transitions for sensitive users. The custom `useCountUp` hook uses standard `requestAnimationFrame` with quadratic ease-out.

**Alternatives considered:**
- Framer Motion: Adds ~35 KB+ gzipped and runtime overhead for simple fade/scale transitions.
- React Spring: Powerful physics engine, but excessive for dashboard counters and card entrances.

---

## 2026-10-21 — React Error Boundaries & Leaflet Subdomains Safeguard

**Decision:** Add top-level `ErrorBoundary` around main application routes, isolated `MapErrorBoundary` around map views, and ensure `subdomains` option in Leaflet's `TileLayer` always defaults to a valid string (`'abc'`).

**Reason:** 
1. When `SentinelTileLayer` previously set `subdomains: undefined` for standard OpenStreetMap, Leaflet merged `options.subdomains = undefined`. Upon computing tile URLs, Leaflet executed `this._getSubdomain(coords)` which attempted to read `this.options.subdomains.length`, throwing an uncaught `TypeError: Cannot read properties of undefined (reading 'length')`. Without an Error Boundary, this unhandled exception crashed the React component tree and resulted in a blank white screen.
2. An application-level `ErrorBoundary` prevents any unhandled component crash from wiping out the screen, presenting a friendly recovery card with diagnostic details and a "Reload Application" action.
3. A component-level `MapErrorBoundary` isolates spatial/GIS failures specifically to the map frame, ensuring the rest of the dashboard (metrics, intelligence feed, filters, navigation) remains completely interactive and accessible even if a map tile service or canvas error occurs.

---

## 2026-10-21 — India-Centric Map Orientation, English-First Tile Resolution & International Boundary Assessment

**Decision:**
1. Relocate demonstration incident dataset from Lahore to Kolkata, India (`22.5726, 88.3639`).
2. Establish centralized India-wide default coordinates (`DEFAULT_MAP_CENTER = [22.5, 79.0]`, `DEFAULT_MAP_ZOOM = 5`, `STREET_LEVEL_ZOOM = 14`) with environment variable overrides.
3. Keep Leaflet raster architecture with automated MapTiler English Streets (`&language=en`) auto-resolution when `VITE_MAP_API_KEY` is supplied, while retaining zero-credential OpenStreetMap fallback.
4. Implement a dual view controller on `MapPage` (`🇮🇳 India Overview` vs `📍 Street View Reports`).

**Reason:**
1. **Root Cause of Urdu Script:** Standard OpenStreetMap raster tiles render geographic names in the territorial script of the coordinates being viewed. Because demonstration incidents were previously situated in Lahore, Pakistan, the map auto-focused onto Lahore and rendered local Urdu script. Relocating incidents to Kolkata, India immediately replaces Urdu with Latin/Bengali scripts on standard OSM, and provides a realistic national scenario.
2. **Evaluated Approaches:**
   - *Approach A (Vector Tiles via MapLibre GL):* Evaluated OpenFreeMap (`tiles.openfreemap.org`). While vector tiles allow client-side text filtering (`name:latin`), OpenFreeMap provides no raster tiles. Integrating MapLibre GL requires adding heavy dependencies (`maplibre-gl` ~800 KB and Leaflet bindings) and WebGL hardware contexts that increase memory footprint on low-end devices. Furthermore, upstream styles concatenate non-Latin scripts if present.
   - *Approach B (Raster Providers with Free Tier — Selected):* MapTiler Streets provides an explicit `&language=en` query parameter on its raster endpoint (`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key={apiKey}&language=en`). Free Flex tier includes 100,000 requests/month with no credit card required, domain whitelisting, and 100% English Latin text worldwide. CARTO Voyager provides clean Latin-first cartography.
   - *Approach C (OSM Raster Fallback):* Preserved as the zero-credential fail-safe when no API key is supplied, accompanied by an informative UI notice.
3. **Cartographic Boundaries Disclosure:** Global open-data tile providers (OpenStreetMap, MapTiler, CARTO) reflect *de facto* control lines (the Line of Control [LoC] and Line of Actual Control [LAC] in Jammu & Kashmir and Ladakh are rendered as dashed borders). Users must be aware that this differs from the official statutory maps published by the **Survey of India**, which delineate the entire boundary with unbroken sovereign lines.

---

## 2026-10-21 — Milestone 2: FastAPI, SQLite, Pydantic v2, and Secure Media Architecture

**Decision:**
1. Implement backend service using FastAPI with Uvicorn on port 8000.
2. Use SQLite via SQLAlchemy 2.0+ ORM with `check_same_thread=False` and declarative mapping.
3. Validate and serialize all requests/responses using Pydantic v2 (`ConfigDict(from_attributes=True)`).
4. Implement secure media intake via Pillow: re-encoding images, stripping EXIF tags, rejecting invalid MIME types/extensions, and generating cryptographic UUID filenames.
5. Enforce report description immutability at the API routing layer (`PATCH /api/reports/{id}`).
6. Connect the frontend through `RealApiClient` (implementing `ApiClient`), switchable via `VITE_USE_MOCK_API`.

**Reason:**
1. **Zero External Infrastructure Overhead:** SQLite runs locally within `backend/sentinel.db` with zero database servers to configure, start, or maintain on Windows, making it ideal for beginner development while fully supporting relational constraints and foreign keys.
2. **Defensive API Design:** Custom exception handlers intercept `RequestValidationError` and unhandled exceptions to return clean, standardized error objects (`{ "detail": "...", "errors": [...] }`) without exposing internal server paths, Python stack traces, or environment variables.
3. **Privacy and Safety in Media Ingestion:** Citizen photo uploads could inadvertently expose GPS coordinates or camera serial numbers through EXIF metadata. Stripping EXIF metadata and renaming files to random UUIDs eliminates geolocation leakage, prevents directory traversal attacks, and ensures consistent JPEG/PNG/WebP formats.
4. **Clean Abstraction Boundary:** The frontend `ApiClient` interface guarantees that UI components are completely decoupled from the transport layer. The application seamlessly operates against the mock database (offline localStorage) or the real FastAPI database without changing a single line of React code.

---

## 2026-10-31 — Layout V3: Bento Command Center, Master-Detail Reports Flow, Ambient Floating Tiles & Quick Action Panel

**Decision:**
1. Maintain the exact modern slate/navy/teal civic intelligence color palette, system sans typography, and component tokens established on `main` / `master`.
2. Keep the `design-v2` branch (warm alabaster paper `#F7F5EE`, deep spruce `#215947`, and `Newsreader` editorial serif) isolated without merging, preserving it for future design reference.
3. Overhaul the page layouts on a dedicated `layout-v3` branch:
   - **Bento Dashboard:** Replaced the uniform row of cards with an asymmetric Bento grid featuring an interactive GIS spatial preview hero tile (8 cols), active anomaly correlator (4 cols), 4 animated telemetry metric tiles with `useCountUp`, and a live report activity feed.
   - **Master-Detail Reports Directory:** Implemented a split-pane reading layout on desktop (7 cols report list, 5 cols sticky incident detail inspector) allowing inspection of report details, coordinates, and provenance without losing scroll position, while preserving full-page routing (`/reports/:id`) for mobile and deep links.
   - **Grouped Incident Intake Form:** Restructured `ReportIncident` into 3 clearly defined visual sections (Observation Narrative & Severity, Spatial Geolocation & Address, Temporal Timestamp) accompanied by a sticky submission dock for seamless one-click submission.
   - **Command Header & Search Shortcut:** Integrated a directory search shortcut in the top navigation triggered by the `/` keyboard shortcut.
   - **Ambient Floating Tiles (`FloatingTiles.tsx`):** Added 6 subtle, abstract geometric wireframe tiles in page header backgrounds drifting via hardware-accelerated CSS keyframes, auto-pausing on tab blur (`visibilitychange`), and disabled under `prefers-reduced-motion`.
   - **Floating Quick-Action Panel (`QuickReportFAB.tsx`):** Added a persistent bottom-right quick-intake button with pulsating telemetry status and full keyboard accessibility (`Tab`/`Enter`), automatically hidden on `/report`.

**Reason:**
Addresses the user's preference for the clean, high-contrast, production SaaS color scheme and typography while providing superior visual hierarchy, improved reading flow for incident triage, and tasteful micro-animations without adding external animation libraries or altering backend APIs.

**Alternatives considered:**
- Heavy modal drawer for report inspection: Interrupts navigation context and creates focus-trapping challenges; the sticky split-pane inspector preserves contextual reading flow on desktop.
- Third-party animation library (Framer Motion / Spring): Evaluated but rejected; CSS hardware-accelerated keyframe transforms and the native `useCountUp` hook achieve identical smoothness with zero bundle overhead.



