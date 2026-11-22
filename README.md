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
| 3 — Report Analysis | ✅ Complete |
| 4 — Geospatial Intelligence | ✅ Complete |
| 5 — Prioritisation & Missing-Signal Detector | ✅ Complete |
| 6 — Polish & Validation | ✅ Complete |
| 7 — Optional Advanced Features | ✅ Complete |

**What works right now:** Full React frontend + FastAPI backend + SQLite database (`sentinel.db`) + Milestone 3 Automated NLP Report Analysis + Milestone 4 Geospatial Intelligence + Milestone 5 Multi-Factor Prioritisation & Missing-Signal Detector + Milestone 6 Full Stack Validation + Milestone 7 GIS & CSV Data Export. Supports creating, retrieving, searching, and filtering reports, automated severity classification (scikit-learn), rule-based entity extraction (location, depth, time), semantic duplicate report detection (cosine similarity), composite confidence scoring with explanatory rationale, interactive report analysis UI, secure photo upload with EXIF sanitization, Haversine distance, multi-factor spatio-temporal matching, graph-based connected components clustering (`POST /api/incidents/cluster`), interactive GIS map with incident cluster buffers and layer toggling, mini cluster map preview, 6-factor incident prioritisation engine, 8 deterministic missing-signal audit rules, human verification workflow with audit log, live telemetry endpoints (`/api/system/info`), GeoJSON and CSV data exports for municipal emergency teams (`/api/reports/export/geojson`, `/api/incidents/export/geojson`, `/api/reports/export/csv`), and automated test coverage (72 frontend vitest tests + 38 backend pytest tests = 110 passing tests). Toggle between offline mock and live backend via `VITE_USE_MOCK_API`.

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

## Run Demo in 5 Minutes (Quick Start from Clean Clone)

Get the complete SENTINEL platform (Frontend + FastAPI Backend + SQLite + NLP Analysis + Geospatial Clustering) up and running in under 5 minutes from a clean git clone.

### 1. Environment Setup

```powershell
# In the SENTINEL repository root:
Copy-Item .env.example .env
```
*(By default, `.env` configures standard OpenStreetMap tiles and connects seamlessly to the FastAPI backend).*

### 2. Start the Backend (Terminal 1)

```powershell
# Open a terminal in the SENTINEL directory
cd backend

# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r requirements.txt

# Pre-seed realistic urban waterlogging reports and initial clusters
python -m app.seed

# Launch the FastAPI backend
python run.py
```
- API Endpoint: **http://127.0.0.1:8000**
- Interactive Swagger Documentation: **http://127.0.0.1:8000/docs**
- Health Telemetry: **http://127.0.0.1:8000/api/health**

### 3. Start the Frontend (Terminal 2)

```powershell
# Open a second terminal in the SENTINEL directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
- Open browser at: **http://localhost:5173**

> 💡 **Connect to Live Backend:**
> In the root `.env`, set `VITE_USE_MOCK_API=false` to route all report submissions, NLP analysis, and clustering directly through the FastAPI backend and SQLite database.

### 4. Guided Feature Tour (5-Minute Walkthrough)

1. **Intake & Submission:** Navigate to `/report` and submit a community report describing waterlogging (e.g., *"Knee-deep water accumulating near Park Street metro entrance due to choked drain"*).
2. **Automated NLP Analysis:** On submission, the backend automatically runs severity classification, extracts location/water-depth/time entities, checks for duplicates, and assigns a calibrated confidence score.
3. **GIS & Geospatial Clustering:** Visit `/map` to see community reports visualized on the interactive Leaflet GIS map. Click **Run Clustering** to run multi-factor spatio-temporal clustering and form incident hypotheses with 150m–300m spatial buffer rings.
4. **Prioritisation & Evidence Audit:** Click any cluster or go to `/incidents/{id}` to inspect the 6-factor prioritisation score (0–100), transparent factor breakdown, missing-signal audit gaps (`MS-LOC`, `MS-INDEP`, `MS-VERIFY`), and log a field inspection.
5. **GIS Data Export:** Download GeoJSON report geometries and incident clusters directly from the `/map` toolbar or export CSV tabular records from `/reports`.

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
tests/test_analysis.py::test_extractor_locations PASSED
tests/test_analysis.py::test_extractor_depth_numeric_and_descriptive PASSED
tests/test_analysis.py::test_extractor_time_hints PASSED
tests/test_analysis.py::test_extractor_all_combined PASSED
tests/test_analysis.py::test_classifier_predict_shape_and_classes PASSED
tests/test_analysis.py::test_classifier_empty_input PASSED
tests/test_analysis.py::test_duplicate_detection_similar_and_dissimilar PASSED
tests/test_analysis.py::test_duplicate_detection_empty PASSED
tests/test_analysis.py::test_confidence_score_range_and_reason PASSED
tests/test_analysis.py::test_embedding_generation_and_caching PASSED
tests/test_analysis.py::test_api_analyze_and_get_analysis_endpoints PASSED
tests/test_analysis.py::test_api_analysis_404_not_found PASSED
======================== 26 passed in 4.60s ========================
```

---

## Milestone 3 — Report Analysis (Quick Start & Manual Testing)

Milestone 3 equips SENTINEL with automated NLP and heuristic intelligence to parse citizen reports, classify severity, extract civic landmarks and water depths, detect duplicate submissions, and compute an explainable confidence score.

### 1. Train the Severity Classifier
The classifier is trained on realistic urban flood reports from `backend/data/seed_reports.csv` and serialized to `backend/data/severity_model.joblib`:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python scripts/train_classifier.py
```

### 2. Manual Testing with curl / PowerShell

#### A. Create a Report (Auto-triggers Analysis)
```powershell
$body = @{
  original_description = "Severe waterlogging on Park Street near Fire Station. Water is 40 cm deep since morning with several cars stranded."
  address = "Park Street, Kolkata"
  reported_severity = 4
} | ConvertTo-Json

$report = Invoke-RestMethod -Uri http://127.0.0.1:8000/api/reports -Method Post -ContentType "application/json" -Body $body
$report.id
```

Equivalent with `curl`:
```bash
curl -X POST http://127.0.0.1:8000/api/reports \
  -H "Content-Type: application/json" \
  -d '{"original_description":"Severe waterlogging on Park Street near Fire Station. Water is 40 cm deep since morning with several cars stranded.","address":"Park Street, Kolkata","reported_severity":4}'
```

#### B. Fetch Report Analysis
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/reports/$($report.id)/analysis" | ConvertTo-Json
```

Equivalent with `curl`:
```bash
curl http://127.0.0.1:8000/api/reports/<REPORT_ID>/analysis
```

#### C. Trigger On-Demand Re-Analysis
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/reports/$($report.id)/analyze" -Method Post | ConvertTo-Json
```

Equivalent with `curl`:
```bash
curl -X POST http://127.0.0.1:8000/api/reports/<REPORT_ID>/analyze
```

### 3. Known Limitations (Milestone 3)
- **Embedding Provider Wheel Availability:** On Python 3.14 environments where PyTorch wheels are not yet pre-built, the system automatically and transparently operates in `tfidf` mode using 512-dimensional normalized feature vectors, requiring zero downloads and working 100% offline. If running on Python 3.11–3.12, `sentence-transformers` (`all-MiniLM-L6-v2`) can be installed for dense semantic embeddings.
- **Seed Training Corpus Size:** The severity classifier is trained on 50 seed examples. It accurately demonstrates multi-class classification and probability calibration, but for production deployment, continuous retraining on broader municipal datasets is recommended.
- **Synchronous Duplicate Comparison Window:** Duplicate detection scans the most recent 100 reports in the database to maintain fast sub-second API response times without requiring background task workers or external vector databases.

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
| Incident Investigation page | ✅ Complete | Operational cluster telemetry with linked observation audit, distance from centroid, and spatial inspection |
| Backend API & SQLite DB | ✅ Complete | FastAPI + SQLAlchemy 2.0 (`sentinel.db`) |
| Secure photo upload | ✅ Complete | EXIF sanitization, type/size enforcement via Pillow |
| Semantic report matching & analysis | ✅ Complete | Milestone 3: NLP severity classification, entity extraction, duplicate detection, confidence score |
| Geographic clustering | ✅ Complete | Multi-factor spatio-temporal clustering with Haversine distance, centroid calculation, and Leaflet cluster buffers |
| Prioritisation scoring | ✅ Complete | 6-factor composite index (0–100) with dynamic re-normalization for missing data |
| Missing-Signal Detector | ✅ Complete | 8 deterministic audit rules (MS-LOC, MS-TIME, MS-CONFLICT, MS-INDEP, MS-VERIFY, MS-HIST, MS-WX, MS-PHOTO) |
| Explainable alerts | ✅ Complete | Transparent three-tier auditable narrative + multi-factor point contributions showing WHY an area received its score |

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
