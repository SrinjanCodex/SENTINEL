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
