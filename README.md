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
| 2 — Backend & Database | ⬜ Planned |
| 3 — Report Analysis | ⬜ Planned |
| 4 — Geospatial Intelligence | ⬜ Planned |
| 5 — Prioritisation & Missing-Signal Detector | ⬜ Planned |
| 6 — Polish & Validation | ⬜ Planned |

**What works right now:** Full React frontend with demonstration data, report submission (browser-stored), map, search/filter, and a keyword-based classifier. No backend required.

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

## Quick Start (Milestone 1 — Frontend only)

Open **VS Code**, then open the **integrated terminal** (`` Ctrl+` ``).

```powershell
# 1. Navigate to the frontend folder
cd frontend

# 2. Install dependencies (only needed once, or after pulling changes)
npm install

# 3. Start the development server
npm run dev
```

The app will be available at: **http://localhost:5173**

Open that URL in your browser. You should see the SENTINEL dashboard with demonstration data.

---

## Environment Variables

Copy `.env.example` to `.env` and edit as needed:

```powershell
# From the SENTINEL root folder:
Copy-Item .env.example .env
```

`.env.example` contents:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK_API=true

# English / Latin-script map tiles (CARTO Voyager)
# Free for development, non-commercial, and open-source civic usage without an API key
VITE_MAP_TILE_URL=https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png
VITE_MAP_ATTRIBUTION=&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>
```

> ⚠️ **Never commit `.env`** — it is in `.gitignore`. Commit only `.env.example`.

In Milestone 1, `VITE_USE_MOCK_API=true` is the active mode. The map tiles default to CARTO Voyager for global English/Latin labels without an API key.

---

## Running Tests

```powershell
cd frontend
npm run test
```

Expected output (Milestone 1 Enhanced):
```
✓ src/lib/__tests__/classification.test.ts  (9 tests)
✓ src/lib/__tests__/validation.test.ts     (24 tests)
✓ src/lib/__tests__/useCountUp.test.ts       (2 tests)
Test Files  3 passed (3)
Tests       35 passed (35)
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
| Dashboard with live stats | ✅ Working | Stats computed from real data |
| Report submission form | ✅ Working | Full validation, browser-stored |
| Reports list with search/filter | ✅ Working | Filters by category, status, date |
| Report detail view | ✅ Working | All fields shown, "Not provided" for missing |
| Interactive map | ✅ Working | Demo data markers; unknown locations listed separately |
| Keyword classification | ✅ Working | Transparent, tested |
| System Information page | ✅ Working | Static placeholder (will be live in M5) |
| Incident Investigation page | ✅ Stub | Demo data only; full features in M5 |
| Backend API | ⬜ Planned | Milestone 2 |
| Photo upload | ⬜ Planned | Milestone 2+ |
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
