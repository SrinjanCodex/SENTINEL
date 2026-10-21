# SENTINEL — Project Status

**Last Updated:** 2026-10-21
**Current Milestone:** 1 — Frontend Foundation
**Status:** ✅ Complete (Ready for user review before Milestone 2)

---

## Milestone Progress

| # | Milestone | Status |
|---|-----------|--------|
| 1 | Frontend Foundation | ✅ Complete |
| 2 | Backend & Database | ⬜ Planned |
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
- Responsive Tailwind CSS styling
- React Leaflet map preview on Dashboard
- Accessibility pass (focus states, ARIA labels, form field labels)
- Automated unit testing with Vitest (33 tests passed):
  - `src/lib/__tests__/classification.test.ts` (9 tests passed)
  - `src/lib/__tests__/validation.test.ts` (24 tests passed)
- Production build verified (`npm run build` succeeds cleanly with 0 TypeScript/bundler errors)
- Dev server verified (`npm run dev` serves HTTP 200 at http://localhost:5173)

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
