# SENTINEL — Architecture

**Last Updated:** 2026-11-15
**Current State:** Milestone 3 — Report Analysis complete (FastAPI + SQLite + NLP Severity Classifier & Entity Extractor)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                        │
│                                                                 │
│  React + TypeScript + Vite (port 5173)                         │
│  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌──────┐  ┌──────┐  │
│  │Dashboard │  │ Report   │  │Reports │  │  Map │  │System│  │
│  │          │  │ Incident │  │  List  │  │      │  │ Info │  │
│  └────┬─────┘  └────┬─────┘  └───┬────┘  └──┬───┘  └──┬───┘  │
│       │             │             │           │          │      │
│       └─────────────┴─────────────┴───────────┴──────────┘     │
│                              │                                  │
│                    src/api/index.ts                             │
│                    getApiClient()                               │
│                         │                                       │
│              ┌──────────┴──────────┐                           │
│              │                     │                           │
│    MockApiClient             RealApiClient                     │
│    (Milestone 1)             (Milestone 2+)                    │
│    localStorage              HTTP → FastAPI                    │
│    + demoData.ts                                               │
└─────────────────────────────────────────────────────────────────┘
                                    │
                         ─ ─ ─ ─ ─ ─ ─ ─ ─
                        | FastAPI (port 8000)|  ← Milestone 2+
                        | Python + SQLAlchemy|
                        |   SQLite database  |
                         ─ ─ ─ ─ ─ ─ ─ ─ ─
```

---

## Data Flow

1. **User submits a report** → `ReportIncident.tsx` validates the form → calls `getApiClient().createReport()` → `MockApiClient` classifies the text (keyword baseline) → stores in localStorage → returns the created `Report` object.

2. **Dashboard loads** → calls `getDashboardStats()`, `listReports()`, `listIncidents()` → `MockApiClient` returns demo data + localStorage reports, computes stats from real data → dashboard renders with actual counts.

3. **Reports list loads** → `listReports(filters)` → mock client applies search/filter/pagination in memory → returns `PaginatedResponse<Report>`.

4. **Map page loads** → `listReports()` → renders only reports with non-null coordinates → reports without coordinates are listed separately.

When Milestone 2 is connected: step 1 becomes an HTTP POST to `/api/reports`. The pages don't change — only the implementation behind `getApiClient()` changes.

---

## Frontend Structure

```
frontend/src/
├─ api/
│  ├─ index.ts           ← getApiClient() factory — the only import pages use
│  └─ mockClient.ts      ← MockApiClient (localStorage + demo data)
├─ components/
│  ├─ ui.tsx             ← all reusable components (StatCard, Badge, Card, etc.)
│  └─ Navigation.tsx     ← top navigation bar with mobile menu
├─ data/
│  └─ demoData.ts        ← DEMO_REPORTS, DEMO_INCIDENTS (all is_synthetic=true)
├─ lib/
│  ├─ classification.ts  ← keyword-based report classifier (tested)
│  ├─ validation.ts      ← form field validators (tested)
│  ├─ formatters.ts      ← date/time/coord formatters
│  └─ __tests__/         ← unit tests (Vitest)
├─ pages/
│  ├─ Dashboard.tsx      ← overview with stats, recent reports, map preview
│  ├─ ReportIncident.tsx ← report submission form with full validation
│  ├─ Reports.tsx        ← searchable/filterable list of all reports
│  ├─ ReportDetail.tsx   ← single report detail view
│  ├─ MapPage.tsx        ← interactive Leaflet map
│  ├─ IncidentDetail.tsx ← potential incident detail (Milestone 5 stub)
│  └─ SystemInfo.tsx     ← how SENTINEL works (Milestone 1: static)
├─ types/
│  └─ index.ts           ← all shared TypeScript types + ApiClient interface
├─ App.tsx               ← BrowserRouter + Routes
├─ main.tsx              ← React entry point
├─ index.css             ← Tailwind v4 + design tokens + global styles
└─ test-setup.ts         ← Vitest setup (jest-dom matchers)
```

---

## TypeScript Types

All types are in `src/types/index.ts`. Key ones:

| Type | Description |
|------|-------------|
| `Report` | A single community waterlogging report |
| `Incident` | A system-detected potential incident (cluster of reports) |
| `Evidence` | A piece of evidence attached to an incident |
| `MissingSignal` | A flagged evidence gap (MS-LOC, MS-VERIFY, etc.) |
| `PriorityAssessment` | Score breakdown per incident |
| `ApiClient` | Interface all pages program against |
| `CreateReportPayload` | Data a user submits to create a report |
| `DashboardStats` | Aggregate statistics for the dashboard |

---

## Database Schema (Milestone 2+)

Planned SQLite/SQLAlchemy models:

### Report
| Column | Type | Notes |
|--------|------|-------|
| id | UUID/string | Primary key |
| original_description | TEXT | Never modified after submission |
| category | VARCHAR | ReportCategory enum |
| category_confidence | FLOAT | NULL if uncertain |
| category_uncertain | BOOLEAN | True when classifier not confident |
| reported_severity | INT | 1–5, nullable |
| address | TEXT | Nullable |
| latitude | FLOAT | Nullable |
| longitude | FLOAT | Nullable |
| observed_at | DATETIME | Nullable |
| submitted_at | DATETIME | Set by server |
| status | VARCHAR | unverified/linked/dismissed |
| photo_reference | VARCHAR | Nullable filename |
| reporter_token | VARCHAR | Anonymous random ID |
| is_synthetic | BOOLEAN | True for demo data |
| updated_at | DATETIME | |

### Incident
| Column | Type | Notes |
|--------|------|-------|
| id | UUID/string | |
| title | TEXT | |
| centroid_latitude | FLOAT | Nullable |
| centroid_longitude | FLOAT | Nullable |
| first_observed_at | DATETIME | Nullable |
| last_observed_at | DATETIME | Nullable |
| verification_status | VARCHAR | suspected/under_verification/verified/dismissed/resolved |
| created_at | DATETIME | |
| last_analysed_at | DATETIME | Nullable |
| analysis_version | VARCHAR | |

### IncidentReport (join table)
| Column | Type | Notes |
|--------|------|-------|
| incident_id | FK → Incident | |
| report_id | FK → Report | |
| match_score | FLOAT | |
| match_reasons | JSON | Structured reasons |
| is_independent | BOOLEAN | Not a near-duplicate |
| added_by | VARCHAR | 'system' or 'human' |

### ReportAnalysis (Milestone 3)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID/string | Primary key |
| report_id | FK → Report | Unique 1-to-1 link, indexed |
| severity | VARCHAR(20) | Predicted label: low / moderate / high / critical / uncertain |
| severity_confidence | FLOAT | Classifier model probability (0.0–1.0) |
| all_scores | JSON | Dictionary of probabilities across all severity classes |
| confidence_score | FLOAT | Composite 0.0–1.0 confidence score |
| confidence_reason | TEXT | Human-readable explanation of confidence factors |
| extracted_locations | JSON | List of rule-extracted street names, landmarks, wards |
| extracted_depth | VARCHAR(50) | Extracted numeric or descriptive water depth |
| extracted_times | JSON | List of extracted temporal phrases |
| possible_duplicates | JSON | List of matching reports with similarity scores |
| embedding_provider | VARCHAR(50) | "sentence-transformers" or "tfidf" |
| analysed_at | DATETIME | Timestamp of analysis execution |

### Evidence, VerificationRecord, PriorityAssessment, MissingSignal
See `src/types/index.ts` for full field list.

---

## API Endpoints

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| GET | `/api/health` | ✅ Operational | Health check and database connectivity |
| GET | `/api/stats` | ✅ Operational | Real database dashboard statistics |
| GET | `/api/system/info` | ✅ Operational | Capability matrix and runtime thresholds |
| POST | `/api/reports` | ✅ Operational | Create a report (with validation) |
| GET | `/api/reports` | ✅ Operational | List reports (search, filter, paginate) |
| GET | `/api/reports/{id}` | ✅ Operational | Get single report detail |
| PATCH | `/api/reports/{id}` | ✅ Operational | Update mutable fields (description is immutable) |
| POST | `/api/reports/upload-photo` | ✅ Operational | Secure photo upload (EXIF stripped, Pillow verified) |
| GET | `/api/incidents` | ✅ Operational | List potential incidents |
| GET | `/api/incidents/{id}` | ✅ Operational | Incident detail with linked report IDs |
| POST | `/api/reports/{id}/analyze` | ✅ Operational | Trigger automated NLP/heuristic report analysis |
| GET | `/api/reports/{id}/analysis` | ✅ Operational | Retrieve stored analysis results for a report |
| POST | `/api/analysis/run` | ⬜ Planned (M4) | Trigger geospatial clustering pipeline |
| PATCH | `/api/incidents/{id}/verification` | ⬜ Planned (M5) | Record human verification inspection |

---

## AI/ML Components

### Milestone 1 — Keyword Classifier (active)
File: `src/lib/classification.ts`
- Phrase-matching against curated keyword lists per category
- Returns category, confidence (0–1), uncertain flag
- If no category scores clearly ahead → "uncertain"
- Tested in `__tests__/classification.test.ts`

### Milestone 3 — Automated Report Analysis (active)
Directory: `backend/app/analysis/`
1. **Entity Extractor (`extractor.py`):** Rule-based regex parser extracting location hints (roads, landmarks, wards), water depth mentions (numeric measurements and descriptive phrases), and observation time references.
2. **Embeddings Engine (`embeddings.py`):** Provides fixed-dimension vector representations for text. Loads `all-MiniLM-L6-v2` when available, with automatic zero-download fallback to 512-dimensional normalized hashing vectors. Results are cached via SHA-256 keys.
3. **Semantic Duplicate Detector (`duplicates.py`):** Evaluates cosine similarity of report embeddings against recent database reports, filtering by `DUPLICATE_THRESHOLD` (default 0.75).
4. **Severity Classifier (`classifier.py`):** Scikit-learn Pipeline with `TfidfVectorizer` and balanced `LogisticRegression`, trained on 50 civic seed reports (`data/seed_reports.csv`) and saved via `joblib`.
5. **Confidence Engine (`confidence.py`):** Produces composite score:
   `score = 0.40 * classifier_probability + 0.30 * entity_completeness + 0.30 * corroboration`
   Generates human-readable explanatory rationale.

### Prioritisation Score (Milestone 5)
```
score = Σ (normalised_factor × weight) × 100
```
Factors: severity, independent_reports, evidence_strength, historical_recurrence,
environmental_context, recency. Missing factors excluded and re-normalised.

---

## Missing-Signal Detector Rules

| Rule ID | Severity | Triggers when |
|---------|----------|---------------|
| MS-LOC | High | No coordinates, or very coarse address |
| MS-TIME | Medium | Observation time missing from any report |
| MS-CONFLICT | High | Descriptions contradict each other |
| MS-INDEP | High | Fewer independent reports than minimum |
| MS-VERIFY | High | No human verification recorded |
| MS-HIST | Medium | No historical data for area |
| MS-WX | Medium | Weather data unavailable or stale |
| MS-PHOTO | Low | No photo evidence |

Rules are individually testable Python functions (Milestone 5).

---

## Map

- Library: React Leaflet v5 + Leaflet v1.9
- Tiles: OpenStreetMap (free, attribution required)
- Attribution: `© OpenStreetMap contributors`
- Marker fix: Using `CircleMarker` instead of default `Marker` to avoid Vite bundler icon-path issue
- Reports without coordinates: never plotted, listed separately

---

## Report Matching Configuration (defaults, all configurable)

```python
SEMANTIC_WEIGHT    = 0.40
GEOGRAPHIC_WEIGHT  = 0.30
TIME_WEIGHT        = 0.15
CATEGORY_WEIGHT    = 0.15
CANDIDATE_RADIUS_M = 300      # metres
TIME_WINDOW_HOURS  = 72
LINK_THRESHOLD     = 0.60
```

---

## Scoring Formula Version

`v0.1-demo` — demonstration only (Milestone 1)
`v1.0` — first real implementation (Milestone 5)

Formula version is stored with each `PriorityAssessment` record to allow future re-scoring.
