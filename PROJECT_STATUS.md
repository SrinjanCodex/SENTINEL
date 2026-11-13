# SENTINEL — Project Status

**Last Updated:** 2026-11-13
**Current Milestone:** 2 — Backend & Database
**Status:** ✅ Complete (Milestones 1 & 2 verified; React Bits sensory additions implemented on branch `reactbits-ui`; ready for review)

---

## Milestone Progress

| # | Milestone | Status |
|---|-----------|--------|
| 1 | Frontend Foundation | ✅ Complete |
| 2 | Backend & Database | ✅ Complete |
| 3 | Report Analysis | ⬜ Planned |
| 4 | Geospatial Intelligence | ⬜ Planned |
| 5 | Prioritisation & Missing-Signal Detector | ⬜ Planned |
| 6 | Polish & Validation | ⬜ Planned |
| 7 | Optional Advanced Features | ⬜ Planned |

---

## Completed Features (Tested)

- Project scaffolding (React + TypeScript + Vite frontend)
- Git repository initialised
- `.gitignore`, `.gitattributes`, `.env.example` created
- All four documentation files created (`PROJECT_STATUS.md`, `README.md`, `ARCHITECTURE.md`, `docs/DECISIONS.md`)
- Navigation and routing (React Router v7)
- Overview Dashboard page (with demonstration data)
- Report an Incident form (full client-side validation)
- Incident Reports list with search and filters
- Report Detail view
- System Information page (static, labelled as such)
- Mock API layer (`src/api/`) — demonstration data + localStorage persistence
- Production SaaS Visual Design Upgrade:
  - Replaced emoji glyphs with consistent Lucide SVG telemetry icons
  - Elevated navigation bar with live status indicator pill and quick intake CTA
  - Card elevation with subtle borders, ambient shadows, and hover elevation
  - Animated status pulse indicators on unverified/suspected items
  - Skeleton loading placeholders during initial telemetry retrieval
  - Tabular number formatting and refined micro-typography tokens
  - Explicit styling for unmapped coordinates and Missing-Signal alerts
- Map Tile Architecture & Graceful Fallback:
  - Safe working default: Standard OpenStreetMap raster tiles (100% free, zero credentials required)
  - Proactive safeguard: Intercepts key-requiring providers (CARTO, MapTiler, Stadia) if configured without an API key, automatically falling back to standard OpenStreetMap to prevent watermarked or broken tiles
  - Reactive fallback: `SentinelTileLayer` catches tile load errors (`tileerror`), recovers immediately to OpenStreetMap, and presents an accessible, dismissible alert notice
  - Configurable tile provider and optional API key via `VITE_MAP_TILE_URL`, `VITE_MAP_ATTRIBUTION`, and `VITE_MAP_API_KEY`
  - Automated MapTiler English Streets Resolution: Supplying `VITE_MAP_API_KEY` automatically activates MapTiler Streets with forced English Latin labels (`&language=en`), rendering 100% English labels across all regions
  - Dual View Controller: Seamless toggling between `🇮🇳 India Overview` (lat 22.5, lng 79.0, zoom 5) and `📍 Street View Reports` (zoom 14) on the GIS Map page
  - India-Centric Demonstration Data: Relocated demonstration incident reports from Lahore to Kolkata, India (`22.5726, 88.3639`) across Park Street, College Street, Central Avenue, BBD Bagh, and Strand Road, eliminating foreign local script rendering
  - Configurable Default Extents: Centralized `DEFAULT_MAP_CENTER` and `DEFAULT_MAP_ZOOM` with environment variable overrides (`VITE_MAP_DEFAULT_LAT`, `VITE_MAP_DEFAULT_LNG`, `VITE_MAP_DEFAULT_ZOOM`)
- Fluid Micro-Animations & Interactions:
  - Smooth route transitions via `MainRoutes` fade-in wrapper and automatic top scrolling
  - Animated numeric count-up on dashboard metric counters (`useCountUp` custom hook with quadratic ease-out)
  - Staggered entrance animations for dashboard and reports list items (`.stagger-1` to `.stagger-5`)
  - Interactive press feedback (`.btn-press`) on interactive buttons and intake CTAs
  - Native accordion expand/collapse transitions and mobile menu slide-in
  - Full adherence to `@media (prefers-reduced-motion: reduce)`
- React Error Boundaries & Failure Isolation:
  - Application-level `ErrorBoundary` wrapping core routes, preventing full-page white screens and offering a friendly recovery view with reload action
  - Isolated `MapErrorBoundary` wrapping GIS preview and full map views, ensuring map component failures never crash the rest of the intelligence dashboard
- React Leaflet map preview on Dashboard and full GIS page
- Accessibility pass (focus states, ARIA labels, form field labels)
- Automated unit testing with Vitest (51 tests passed):
  - `src/api/__tests__/realClient.test.ts` (4 tests passed)
  - `src/__tests__/smoke.test.tsx` (3 tests passed)
  - `src/lib/__tests__/mapConfig.test.ts` (9 tests passed)
  - `src/lib/__tests__/validation.test.ts` (24 tests passed)
  - `src/lib/__tests__/useCountUp.test.ts` (2 tests passed)
  - `src/lib/__tests__/classification.test.ts` (9 tests passed)
- Production build verified (`npm run build` succeeds cleanly with 0 TypeScript/bundler errors)
- Dev server verified (`npm run dev` serves HTTP 200 at http://localhost:5173)
- Consolidated Frontend Design & Motion (Merged into `main` via `motion-3d`):
  - Final design is `motion-3d` merged into `main`. The rejected design experiment `design-v2` (warm paper `#F7F5EE`, deep spruce `#215947`, Newsreader serif) was tried and discarded (local branch deleted, commit `f30e86c` preserved in reflog).
  - Layout V3 (originally developed on `layout-v3`, merged via `motion-3d`, local branch safely deleted with commit `c0a7d19` integrated into `main`):
    - Retained the production SaaS slate-50/navy/teal design tokens and clean system sans typography.
    - Asymmetric Bento Dashboard layout: GIS spatial preview hero tile (8 cols), active anomaly correlator (4 cols), 4 animated telemetry metrics, and a live report activity feed.
    - Responsive Master-Detail reading flow on Reports page: left scrollable report stream (7 cols) with right sticky incident detail inspector (5 cols) on desktop, preserving scroll position and providing full-page fallback for mobile.
    - Sectioned 3-part incident intake form with sticky submission action dock.
    - Hardware-accelerated abstract geometric floating tiles (`FloatingTiles.tsx`), auto-pausing on tab blur and disabled under `prefers-reduced-motion`.
    - Floating quick-action intake pill (`QuickReportFAB.tsx`) with full keyboard accessibility.
    - Top command navigation with `/` keyboard shortcut for directory search.
  - Flowing Opening Animations & 3D Card Depth (merged into `main` via commit `ea2b236`):
    - Unified motion tokens in `frontend/src/index.css`: fast (150ms), base (250ms), slow (400ms) with spring-like cubic-bezier(0.16, 1, 0.3, 1) ease-out curve.
    - View Transitions API progressive enhancement (`@view-transition`, `::view-transition-old`, `::view-transition-new`) on `<Link viewTransition>` and `<NavLink viewTransition>` with fallback page transitions.
    - Seamless page transitions (`.animate-page-enter`) without layout jumps or white flashes.
    - Staggered entrances across views (50ms intervals, `.stagger-1` to `.stagger-8`) with small rise (`translateY(8px)`) and fade.
    - Opening & closing panels: Mobile menu drawer smoothly expands down (`.animate-drawer-down`) and retracts up (`.animate-drawer-up`), with focus trapping/restoration to trigger button and Escape key dismiss.
    - Smooth list-to-detail interaction: selecting reports in the directory slides the inspector panel in from the right (`.animate-slide-in-right`).
    - Single-run dashboard KPI counter animations with `useCountUp`.
    - Form feedback micro-animations: gentle validation error shake (`.animate-error-shake`) and submit success celebration pop (`.animate-success-pop`).
    - 3D depth and tilt for cards: layered soft shadows (`var(--card-shadow-resting)`, `var(--card-shadow-hover)`), top highlight edge (`var(--card-highlight-top)`), gentle perspective hover tilt (±3° to ±5°) with pointer-following sheen (`.card-3d-sheen`).
    - Selective 3D scope: applied to dashboard stat tiles, report cards, and featured intake tiles; large map, form fields, and data tables stay flat.
    - Fine pointer gating: `@media (hover: hover) and (pointer: fine)` with touch press-down fallback (`:active { transform: scale(0.98); }`).
    - Accessibility: strictly respects `@media (prefers-reduced-motion: reduce)`, preserving visible focus rings (`:focus-visible`), contrast, and crisp text rendering.
  - 57 automated tests passing across 7 test suites (including `motionAndCard.test.tsx`), 0 build/type errors.
- React Bits Sensory UI Enhancements (Branch: `reactbits-ui`):
  - **Zero External Dependencies:** Integrated all four verified React Bits components (`TiltedCard`, `LiquidChrome`, `GradientText`, `GlowCursor`) using native TypeScript, modern WebGL2, and CSS transforms — **0 npm packages added**.
  - **Path Alias & Registry:** Initialized `components.json` with `@/` path alias and `@react-bits` registry, configured in `vite.config.ts`, `tsconfig.json`, and `tsconfig.app.json`.
  - **Part 1 Bug Fix (Pagination Bounds & Error Resilience — Commit `e27d9a8`):**
    - Fixed the 422 Unprocessable Entity error caused by `per_page: 200` exceeding FastAPI's strict validation constraint (`per_page <= 100`).
    - Added `frontend/src/api/pagination.ts` with sequential chunked pagination (`fetchAllReports`), `API_MAX_PAGE_SIZE = 100`, and `MAX_FETCH_PAGES_CAP = 10`.
    - Added defensive clamping in `realClient.ts` (`Math.min(Math.max(1, per_page), 100)`).
    - Upgraded `ErrorAlert` with clear plain-language messaging, interactive retry callback, and collapsible technical disclosure.
    - Added unit test suite in `frontend/src/api/__tests__/pagination.test.ts` (4 tests).
  - **Part 2 Full-Page Shared LiquidChrome Background:**
    - Replaced fragmented section-local canvases with a single, fixed, full-viewport WebGL2 canvas layer in `App.tsx` (`GlobalBackground`).
    - Calibrated with tranquil, low-intensity civic palette (`speed={0.07}`, `amplitude={0.12}`, `opacity-20` light, `opacity-30` dark, `maxDevicePixelRatio={1}`).
    - Built-in static tinted gradient fallback for unsupported WebGL environments, mobile viewports, tab blur, or `prefers-reduced-motion`.
    - Completely eliminates GPU context thrashing and preserves 60fps scrolling under 4x CPU slowdown.
  - **Part 3 Dark Mode Architecture:**
    - Added accessible theme selector with `light`, `dark`, and `system` modes in desktop header and mobile drawer (`Navigation.tsx`).
    - Pre-hydration script in `index.html` preventing theme flash on initial load.
    - `ThemeContext.tsx` with error-resilient `localStorage` persistence and dynamic `prefers-color-scheme` listener.
    - Tailwind CSS v4 class-based dark mode enabled via `@custom-variant dark (&:where(.dark, .dark *));`.
    - Cohesive civic design tokens: deep ink/navy surfaces (`#070b12`, `#0b1220`, `slate-900`), balanced cyan/teal accents, high contrast text (WCAG AA).
    - Night-mode GIS cartography: CSS tile filter inversion/hue-rotation on standard OpenStreetMap tiles (`html.dark .leaflet-tile-pane`) preserving un-inverted markers, popups, and zoom controls.
  - **Part 4 Universal Card Tilt Unification:**
    - Embedded React Bits `TiltedCard` as the core engine of the centralized `<Card>` component in `ui.tsx`.
    - Replaced older CSS pointer event listeners and sheen, preventing competing double-tilt effects.
    - Gated by default to `@media (hover: hover) and (pointer: fine)` with touch press-down fallback; disabled under `prefers-reduced-motion`.
    - Configured with subtle civic defaults (`DEFAULT_CARD_MAX_TILT = 3.5`, `DEFAULT_CARD_SCALE = 1.015`, `DEFAULT_CARD_GLARE = 0.14`).
    - Explicit `tilt={false}` exclusions applied to wide data tables, map containers, and active form typing cards.
  - **`GradientText` & `GlowCursor`:**
    - Smooth cyan/teal iridescent headers and interactive navigation branding.
    - Adaptive fine-pointer cursor follower with auto-suppression over forms and map controls.
  - **Performance & Testing Verification:**
    - **72 Vitest tests passing across 10 test files** (including `motionAndCard.test.tsx`, `reactBits.test.tsx`, `pagination.test.ts`, and `routesIntegration.test.tsx`).
    - **14 backend pytest tests passing** (100% backend integrity maintained).
    - Oxlint clean with 0 errors.
    - Production build succeeds with 0 TypeScript/bundler errors. Initial app JS bundle: 580.45 kB (167.97 kB gz); standalone deferred chunks: LiquidChrome (16.12 kB / 6.10 kB gz), GlowCursor (20.93 kB / 7.18 kB gz).
    - Smooth 60fps operation verified under 4x CPU slowdown.

### Milestone 2: Backend & Database Features (Tested)
- FastAPI asynchronous web framework with standard Uvicorn runner
- SQLite database persistence (`sentinel.db`) via SQLAlchemy 2.0+ ORM models:
  - `Report` (immutable original_description, coordinates, severity, category, status, anonymous token, synthetic tag)
  - `Incident` (hypothetical report cluster, verification state, centroid coordinates, priority score)
  - `IncidentReport` (junction table with match scores, match reasons, independence indicators)
  - `Evidence` (structured provenance and verification trails)
  - `VerificationRecord` (audit log for human verification actions)
  - `PriorityAssessment` & `MissingSignal` (placeholders for Milestone 5 scoring and gap detection)
- Pydantic v2 validation and serialization schemas (`ReportCreate`, `ReportUpdate`, `ReportResponse`, `DashboardStatsResponse`)
- Standardized RESTful endpoints under `/api`:
  - `POST /api/reports` (intake validation, anonymous token assignment, 201 Created)
  - `GET /api/reports` (searching across text/address, category and status filtering, server pagination)
  - `GET /api/reports/{id}` (single report lookup with 404 handler)
  - `PATCH /api/reports/{id}` (mutable field updates with description immutability safeguard)
  - `GET /api/stats` (real database aggregation counts for dashboard)
  - `GET /api/health` (database connectivity and service telemetry)
  - `GET /api/system/info` (milestone capability and threshold metadata)
  - `GET /api/incidents` & `GET /api/incidents/{id}` (incident cluster listing and lookup)
- Secure photo upload endpoint (`POST /api/reports/upload-photo`):
  - Enforces 5 MB file size limit (rejects with HTTP 413)
  - Validates MIME types (`.jpg`, `.jpeg`, `.png`, `.webp` - rejects with HTTP 415)
  - Inspects real image byte content via Pillow (rejects corrupted payloads with HTTP 400)
  - Re-encodes and strips all EXIF metadata for privacy and security
  - Cryptographic random UUID filenames to prevent collision and path traversal
- Synthetic demonstration dataset seeder (`seed.py`):
  - Populates 8 Kolkata waterlogging reports and 3 incident clusters clearly tagged `is_synthetic=True`
- Automated pytest suite (14 tests passed in `backend/tests/`):
  - `tests/test_api.py` (9 tests passed)
  - `tests/test_uploads.py` (5 tests passed)
- Full frontend client integration via `RealApiClient` in `frontend/src/api/realClient.ts`:
  - Dynamically activated when `VITE_USE_MOCK_API=false`
  - Fully tested for query parameters, error unpacking, and offline fallbacks

## Known Limitations & Bugs (Milestone 1)

- No backend: data lives in the browser's localStorage only (clearly labelled in UI)
- Map shows only demonstration-data markers (no real GPS data)
- No photo upload in Milestone 1 (backend required)
- System Information page shows static placeholder text
- Scores are demonstration values, not computed by the real algorithm
- Reports without coordinates cannot be plotted on the map

---

## Architecture Summary

```
Browser ──► React + TypeScript + Vite (port 5173)
              │  api/ interface
              ├─ MockApiClient  (localStorage + demo data)   ← Milestone 1
              └─ RealApiClient  (FastAPI backend)            ← Milestone 2+

Backend ──► FastAPI + Python (port 8000)                    ← Milestone 2+
              │  SQLAlchemy
              └─ SQLite database
```

Data flows: user submits a report → `api/` interface → MockApiClient stores it in localStorage → Dashboard and Reports pages read from the same mock client.

---

## Folder Structure

```
sentinel/
├─ PROJECT_STATUS.md        ← this file
├─ README.md                ← setup instructions
├─ ARCHITECTURE.md          ← technical design
├─ docs/DECISIONS.md        ← decision log
├─ .gitignore  .gitattributes  .env.example
├─ frontend/
│  ├─ package.json
│  ├─ vite.config.ts
│  ├─ tailwind.config.js
│  ├─ index.html
│  └─ src/
│     ├─ api/               ← interface + mock + (later) real client
│     ├─ components/        ← reusable UI pieces
│     ├─ pages/             ← Dashboard, ReportIncident, Reports, Map, IncidentDetail, SystemInfo
│     ├─ types/             ← shared TypeScript types
│     ├─ data/              ← demonstration data (clearly labelled)
│     └─ lib/               ← helpers, validation
├─ backend/                 ← Milestone 2+
└─ scripts/                 ← seed/eval scripts
```

---

## Dependencies & Versions (Frontend)

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.1.0 | UI framework |
| react-dom | ^19.1.0 | DOM rendering |
| react-router-dom | ^7.6.2 | Client-side routing |
| react-leaflet | ^5.0.0 | Interactive map |
| leaflet | ^1.9.4 | Map library (peer dep) |
| @types/leaflet | ^1.9.x | TypeScript types for Leaflet |
| tailwindcss | ^4.x | Utility-first CSS |
| @tailwindcss/vite | ^4.x | Tailwind v4 Vite plugin |
| typescript | ~5.8.3 | Type safety |
| vite | ^6.x | Build tool and dev server |
| vitest | ^3.x | Unit testing |

---

## Setup Commands (Windows / PowerShell)

```powershell
# Clone or open the folder in VS Code terminal, then:
cd frontend
npm install
npm run dev        # starts dev server at http://localhost:5173
npm run build      # production build
npm run test       # unit tests
```

---

## Environment Requirements

- Node.js ≥ 20 (tested on v24.21.0)
- npm ≥ 10 (tested on 12.2.0)
- Python 3.11–3.12 recommended for backend (Milestone 2+) — see ARCHITECTURE.md
- Git 2.x

> ⚠️ Python 3.14 is installed but may not have compatible wheels for
> Sentence Transformers / PyTorch (Milestone 3). A compatible version
> will be confirmed before installing those packages.

---

## Important Technical Decisions

See `docs/DECISIONS.md` for full log. Key choices:
- **Tailwind CSS v4** with the official Vite plugin (no PostCSS config needed)
- **Mock API interface** in Milestone 1 — pages never call the backend directly; they call `getApiClient()` which returns either Mock or Real
- **localStorage** for mock persistence — clearly labelled in the UI
- **React Router v7** (latest stable; data-router approach considered but defer to Milestone 2 for simplicity)
- **React Leaflet v5** with Leaflet v1.9 (v5 supports React 19; marker icon fix applied)

---

## Exact Next Steps (Milestone 2)

1. Create `backend/` directory with FastAPI project structure
2. Install Python dependencies in a virtual environment
3. Implement SQLAlchemy models (Report, Incident, Evidence, etc.)
4. Implement Pydantic schemas and CRUD endpoints
5. Implement photo upload with validation and EXIF stripping
6. Add `pytest` tests for all endpoints
7. Connect the frontend's `RealApiClient` to the live backend
8. Update all four documentation files
9. `git commit` with `feat: milestone-2 backend and database`
