# SENTINEL

> **AI-Assisted Urban Waterlogging Intelligence Platform**
> Small signals. Smarter warnings. Safer communities.

SENTINEL connects community reports, geographic data, historical records, and environmental context to identify, analyse, and prioritise potential urban waterlogging and drainage incidents.

> ⚠️ **Decision-support tool only.** SENTINEL does not replace official emergency instructions or human inspection. In an emergency, contact local emergency services.

---

## Current Status

| Milestone | Status |
|-----------|--------|
| 1 — Frontend Foundation | ✅ Complete |
| 2 — Backend & Database | ✅ Complete |
| 3 — Report Analysis | ⬜ Planned |
| 4 — Geospatial Intelligence | ⬜ Planned |
| 5 — Prioritisation & Missing-Signal Detector | ⬜ Planned |
| 6 — Polish & Validation | ⬜ Planned |

**What works right now:** Full React frontend + FastAPI backend + SQLite database (`sentinel.db`). Supports creating, retrieving, searching, and filtering waterlogging reports with real SQLite persistence, secure photo upload with EXIF sanitization, dashboard aggregations, synthetic data seeding, and automated test coverage (57 frontend tests + 14 backend tests). Toggle between offline mock and live backend via `VITE_USE_MOCK_API`.

---

## Prerequisites

Install these before starting:

| Tool | Required Version | How to check |
|------|-----------------|--------------|
| Node.js | ≥ 20 (tested: v24.21.0) | `node --version` |
| npm | ≥ 10 (tested: 12.2.0) | `npm --version` |
| Git | Any recent | `git --version` |
| Python | 3.11–3.12 recommended (needed for Milestone 2+) | `python --version` |

> ⚠️ **Python note:** Python 3.14 is installed on this machine. Sentence Transformers / PyTorch may not have compatible wheels for 3.14 yet. Before starting Milestone 3, we will verify and install a compatible Python version if needed.

---

## Quick Start (Milestone 2 — Full Stack: Frontend + Backend)

Open **VS Code**, then open two terminal tabs (`` Ctrl+Shift+` ``).

### Terminal 1: Start the Backend (FastAPI + SQLite)

```powershell
# 1. Navigate to the backend folder
cd backend

# 2. Create Python virtual environment (if not already created)
python -m venv .venv

# 3. Activate virtual environment
# Note: If PowerShell shows an execution policy error, run:
# Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1

# 4. Install backend dependencies
pip install -r requirements.txt

# 5. Seed synthetic demonstration data (optional, creates initial records)
python -m app.seed

# 6. Start the FastAPI backend server
python run.py
```

The backend API will be available at: **http://127.0.0.1:8000**
- Interactive Swagger API documentation: **http://127.0.0.1:8000/docs**
- Health telemetry: **http://127.0.0.1:8000/api/health**

### Terminal 2: Start the Frontend (React + Vite)

```powershell
# 1. Navigate to the frontend folder
cd frontend

# 2. Install dependencies (only needed once, or after pulling changes)
npm install

# 3. Start the Vite development server
npm run dev
```

The frontend will be available at: **http://localhost:5173**

> 💡 **To connect the frontend to the live backend:**
> In your root `.env` file, set:
> ```env
> VITE_USE_MOCK_API=false
> ```
> And restart the frontend dev server (`Ctrl+C` then `npm run dev`). When set to `false`, all report submissions and statistics are read and written to `backend/sentinel.db`. When set to `true`, it uses browser `localStorage`.

---

## Environment Variables

The project uses a single `.env` file located in the **top-level project root** folder (`SENTINEL/.env`). Vite is configured with `envDir: '../'` in `frontend/vite.config.ts`, so the frontend dev server automatically reads this root `.env` file.

To create your `.env` file:

```powershell
# In the SENTINEL top-level root folder:
Copy-Item .env.example .env
```

### Variable Breakdown & Defaults

| Variable | Required to fill in? | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | No (keep default) | `http://localhost:8000` | The backend API URL for Milestone 2+ |
| `VITE_USE_MOCK_API` | No (keep default) | `true` | `true` uses browser localStorage; `false` connects to live FastAPI backend |
| `VITE_MAP_DEFAULT_LAT` | No (keep default) | `22.5` | Center latitude for map overview (India) |
| `VITE_MAP_DEFAULT_LNG` | No (keep default) | `79.0` | Center longitude for map overview (India) |
| `VITE_MAP_DEFAULT_ZOOM`| No (keep default) | `5` | Subcontinent-level overview zoom level |
| `VITE_MAP_TILE_URL` | No (keep default) | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | Free standard OpenStreetMap tiles |
| `VITE_MAP_ATTRIBUTION` | No (keep default) | OpenStreetMap attribution | Required legal attribution |
| `VITE_MAP_API_KEY` | **Optional** | *(blank)* | **No key is needed.** Standard OSM tiles work without an API key. Only needed if you want MapTiler English labels. |

`.env.example` contents:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK_API=true

# ── Map Tile Configuration ──────────────────────────────────────────────────
# Default: Standard OpenStreetMap raster tiles (100% free, no API key required)
# Note: OSM standard tiles render local territory languages (e.g. Hindi/Bengali in India).
VITE_MAP_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_MAP_ATTRIBUTION=&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors
VITE_MAP_API_KEY=

# Default Map Center & Zoom (Configurable in one place: India Overview)
VITE_MAP_DEFAULT_LAT=22.5
VITE_MAP_DEFAULT_LNG=79.0
VITE_MAP_DEFAULT_ZOOM=5

# Optional: For guaranteed 100% English / Latin-script labels across all regions:
# Option A — MapTiler Streets English (Recommended)
# Sign up for a free key (100k requests/month, no credit card) at https://www.maptiler.com/
# Simply set VITE_MAP_API_KEY=your_key (the app automatically requests language=en tiles)
# VITE_MAP_TILE_URL=https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key={apiKey}&language=en
# VITE_MAP_ATTRIBUTION=&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>
# VITE_MAP_API_KEY=your_free_maptiler_key

# Option B — CARTO Voyager (Free key at https://carto.com/basemaps/apikey/)
# VITE_MAP_TILE_URL=https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?api_key={apiKey}
# VITE_MAP_ATTRIBUTION=&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>
# VITE_MAP_API_KEY=your_free_carto_key
```

> ⚠️ **Never commit `.env`** — it is in `.gitignore`. Commit only `.env.example`.
> If you create or change variables in `.env`, restart the frontend dev server (`Ctrl+C` then `npm run dev`) for changes to take effect.

In Milestone 1, `VITE_USE_MOCK_API=true` is the active mode. The map tiles default safely to OpenStreetMap with zero keys needed. If custom tiles fail or are rejected by a provider, the map automatically recovers by displaying standard OpenStreetMap tiles with a gentle notification.

### International Boundaries Notice
SENTINEL utilizes global OpenStreetMap and MapTiler basemaps. These open basemap providers depict disputed borders (such as the Line of Control [LoC] and Line of Actual Control [LAC] in Jammu & Kashmir and Ladakh) according to *de facto* on-the-ground administration with dashed boundary lines. This differs from the official statutory maps published by the **Survey of India**, which show the entire historical extent of the state within unbroken international boundaries.

---

## Running Tests

### 1. Frontend Tests (Vitest)

```powershell
cd frontend
npm run test
```

Expected output:
```
✓ src/api/__tests__/realClient.test.ts        (4 tests)
✓ src/__tests__/smoke.test.tsx               (3 tests)
✓ src/lib/__tests__/mapConfig.test.ts        (9 tests)
✓ src/lib/__tests__/validation.test.ts      (24 tests)
✓ src/lib/__tests__/useCountUp.test.ts        (2 tests)
✓ src/lib/__tests__/classification.test.ts   (9 tests)
Test Files  6 passed (6)
Tests       51 passed (51)
```

### 2. Backend Tests (Pytest)

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest -v
```

Expected output:
```
tests/test_api.py::test_health_check PASSED
tests/test_api.py::test_dashboard_stats_empty PASSED
tests/test_api.py::test_dashboard_stats_with_data PASSED
tests/test_api.py::test_create_report_success PASSED
tests/test_api.py::test_create_report_validation_errors PASSED
tests/test_api.py::test_list_reports_pagination PASSED
tests/test_api.py::test_list_reports_search_and_filter PASSED
tests/test_api.py::test_get_report_by_id PASSED
tests/test_api.py::test_update_report_immutability PASSED
tests/test_uploads.py::test_upload_photo_valid_jpeg PASSED
tests/test_uploads.py::test_upload_photo_valid_png PASSED
tests/test_uploads.py::test_upload_photo_oversized_rejected PASSED
tests/test_uploads.py::test_upload_photo_invalid_extension PASSED
tests/test_uploads.py::test_upload_photo_corrupted_image PASSED
======================== 14 passed in 1.52s ========================
```

---

## Building for Production

```powershell
cd frontend
npm run build
```

Output goes to `frontend/dist/`. Check that the build completes with no errors.

---

## Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard with live stats | ✅ Working | Real database aggregation (or demo fallback) |
| Report submission form | ✅ Working | Full client/server validation, SQLite persistence |
| Reports list with search/filter | ✅ Working | Server-side or client-side filtering and pagination |
| Report detail view | ✅ Working | Complete audit fields, immutable description |
| Interactive map | ✅ Working | India-centered overview + street-level inspection |
| Keyword classification | ✅ Working | Baseline heuristic (AI matching in Milestone 3) |
| System Information page | ✅ Working | Static placeholder & API status telemetry |
| Incident Investigation page | ✅ Stub | Demo data only; full clustering in Milestone 4 |
| Backend API & SQLite DB | ✅ Complete | FastAPI + SQLAlchemy 2.0 (`sentinel.db`) |
| Secure photo upload | ✅ Complete | EXIF sanitization, type/size enforcement via Pillow |
| Semantic report matching | ⬜ Planned | Milestone 3 |
| Geographic clustering | ⬜ Planned | Milestone 4 |
| Prioritisation scoring | ⬜ Planned | Milestone 5 |
| Missing-Signal Detector | ⬜ Planned | Milestone 5 |
| Explainable alerts | ⬜ Planned | Milestone 5 |

---

## Demo Script (Milestone 1)

Run this to demonstrate the app to someone:

1. Open http://localhost:5173 — you see the **Dashboard** with 3 potential incidents and demonstration data (clearly labelled ⚠️ DEMO).

2. Click **Report Incident** in the nav. Try submitting with an empty description — you'll see a validation error. Then fill in:
   - Description: "Standing water outside the school gate is blocking the footpath. The drain looks blocked with leaves. Water has been here since morning."
   - Severity: 3 – Moderate
   - Location: Near Model Town School
   - Observed: set to a past date and time
   - Click **Submit Report** — you get a success message.

3. Click **Reports** in the nav. You'll see:
   - The 8 demonstration reports (⚠️ DEMO badge)
   - Your new report (Browser-stored badge)
   - Use the search box: type "school" — only school-area reports appear.
   - Filter by category: "Drainage blockage".

4. Click any report to see **Report Detail**. Notice the description is shown in a blockquote labelled "Preserved exactly as submitted. Never modified."

5. Click **Map** in the nav. You see coloured circle markers for the 7 demonstration reports with coordinates. The report without coordinates ("broken street light") appears below the map, never plotted.

6. Click **System Info** to read how SENTINEL works (matching logic, scoring, missing-signal rules).

---

## Troubleshooting (Windows)

### `npm` is not recognized
Node.js is not installed, or not on your PATH. Download from https://nodejs.org and restart VS Code.

### `Activate.ps1` blocked by PowerShell execution policy (Milestone 2+)
If you see "running scripts is disabled on this system":
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```
Or use the `.bat` alternative: `.venv\Scripts\activate.bat`

### Port 5173 already in use
Vite will automatically try the next port (5174, etc.) and tell you the URL.

### Map tiles not loading
Check your internet connection. OpenStreetMap tiles require internet access. The tile URL is configurable via `VITE_MAP_TILE_URL` in `.env`.

### `npm audit` shows vulnerabilities
4 dev-dependency vulnerabilities were present at Milestone 1 in `jsdom` (used only for testing). These do not affect the production build. Run `npm audit` for details.

---

## Project Structure

```
sentinel/
├─ PROJECT_STATUS.md      ← current state, what's done, what's next
├─ README.md              ← this file
├─ ARCHITECTURE.md        ← technical design
├─ docs/DECISIONS.md      ← technical decision log
├─ .gitignore
├─ .gitattributes
├─ .env.example
├─ frontend/              ← React + TypeScript + Vite app
│  ├─ package.json
│  ├─ vite.config.ts
│  ├─ src/
│  │  ├─ api/             ← API interface + mock client
│  │  ├─ components/      ← reusable UI
│  │  ├─ data/            ← demonstration data
│  │  ├─ lib/             ← classification, validation, formatters
│  │  ├─ pages/           ← all page components
│  │  └─ types/           ← shared TypeScript types
│  └─ ...
├─ backend/               ← FastAPI (Milestone 2+)
└─ scripts/               ← seed, evaluation scripts
```

---

## Notes for a Different AI Model (Resume Instructions)

If you are an AI model picking this up after a break, read the **RESUME PROMPT** at the top of the master prompt, then:

1. Read `PROJECT_STATUS.md`, `ARCHITECTURE.md`, `docs/DECISIONS.md`
2. Run `git log --oneline -n 20` and `git status`
3. Run `cd frontend && npm run test` and `npm run build`
4. Run `npm run dev` and open http://localhost:5173
5. Report the actual state to the user before making any changes
