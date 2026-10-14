# Breathe Map

**Smart-city decision support for hyperlocal air quality planning**

Estimate zone-level AQI, explore pollution patterns, run mitigation scenarios, and export planning reports — built for urban planners, researchers, and policy teams. Outputs are **planning estimates**, not regulatory measurements.

| | |
|---|---|
| **Live demo** | [breathe-map-w.vercel.app](https://breathe-map-w.vercel.app) |
| **Product spec** | [PRD.md](./PRD.md) |
| **Backend setup** | [web/SUPABASE_BACKEND_SETUP.md](./web/SUPABASE_BACKEND_SETUP.md) |

---

## Table of contents

1. [At a glance](#at-a-glance)
2. [Problem & goals](#problem--goals)
3. [System architecture](#system-architecture)
4. [Data flow](#data-flow)
5. [User journeys](#user-journeys)
6. [Database model](#database-model)
7. [Machine learning pipeline](#machine-learning-pipeline)
8. [Application surface](#application-surface)
9. [API reference](#api-reference)
10. [Technology stack](#technology-stack)
11. [Repository layout](#repository-layout)
12. [Local development](#local-development)
13. [Deployment](#deployment)
14. [Scope, ethics & disclaimer](#scope-ethics--disclaimer)

---

## At a glance

```mermaid
mindmap
  root((Breathe Map))
    Plan
      Multi-city scope
      Zone CRUD
      GeoJSON on map
    Estimate
      ML regression
      Formula fallback
      Feature contributions
    Analyze
      Correlations
      K-means clusters
    Simulate
      Traffic reduction
      Green cover
      Rerouting factor
    Report
      CSV export
      PDF export
```

| Capability | Description | Primary UI |
|------------|-------------|------------|
| Hyperlocal AQI | Per-zone estimates from urban proxies + ML | Dashboard, Zones |
| Spatial view | Leaflet map, CARTO dark basemap, zone polygons | Dashboard |
| Pattern analysis | Correlation & clustering over zone features | Analysis |
| What-if simulation | Before/after AQI for mitigation levers | Simulation |
| Reporting | City summary exports for planning docs | Nav → Export |

### AQI category scale (India CPCB–aligned bands)

| Category | AQI range | Planning signal |
|----------|-----------|-----------------|
| Good | 0–50 | Low concern |
| Satisfactory | 51–100 | Acceptable; monitor growth |
| Moderate | 101–200 | Sensitive groups at risk |
| Poor | 201–300 | Health warnings; intervention priority |
| Severe | 301+ | Emergency planning tier |

```mermaid
pie showData
    title Illustrative zone AQI mix (demo)
    "Good" : 12
    "Satisfactory" : 28
    "Moderate" : 35
    "Poor" : 18
    "Severe" : 7
```

*Chart is illustrative; actual distribution depends on your city’s zones and estimates.*

---

## Problem & goals

Urban AQI is often published as a **single city average**, which hides block-level variation driven by traffic, land use, and density. Planners need tools to **estimate** hyperlocal conditions and **compare** mitigation options before capital spend.

**Goals**

- Estimate AQI at **zone / ward / grid** resolution within a city  
- Relate estimates to **interpretable urban factors** (traffic, population, roads, land use)  
- Run **scenario simulations** (e.g. vehicle reduction, green cover)  
- Present results on an **interactive map** and in **exportable reports**  
- Stay feasible for academic / hackathon use (no live sensor mesh required)

**Non-goals:** real-time IoT ingestion, causal source apportionment, enforcement, or citizen surveillance. See [PRD.md](./PRD.md) for full scope.

---

## System architecture

### Context (who talks to what)

```mermaid
flowchart LR
    subgraph Users
        P[Urban planner]
        R[Researcher]
    end

    subgraph BreatheMap["Breathe Map (Next.js on Vercel)"]
        UI[React UI<br/>App Router]
        API[Route Handlers<br/>/app/api/*]
        ML[Python inference<br/>lib/ml/infer.py]
    end

    subgraph External
        SB[(Supabase<br/>PostgreSQL + Auth)]
        CARTO[CARTO Basemaps API]
        OSM[OpenStreetMap data<br/>attribution]
    end

    P --> UI
    R --> UI
    UI --> API
    API --> SB
    API --> ML
    UI --> CARTO
    CARTO -.-> OSM
```

### Container view (inside the web app)

```mermaid
flowchart TB
    subgraph Client["Browser"]
        Pages["Pages<br/>/, /dashboard, /zones, …"]
        Ctx["CityContext<br/>selected city + localStorage"]
        Map["zone-map.tsx<br/>Leaflet + GeoJSON"]
    end

    subgraph Server["Next.js server"]
        Routes["API routes"]
        Repo["lib/db/repository.ts"]
        Adapter["lib/db/adapter.ts"]
        InferTS["lib/ml/inference.ts"]
        InferPY["lib/ml/infer.py"]
        Fallback["lib/ml/fallback.ts"]
    end

    subgraph Data["Supabase"]
        PG[(PostgreSQL)]
        RLS[Row Level Security]
    end

    Pages --> Ctx
    Pages --> Map
    Pages --> Routes
    Routes --> Repo
    Repo --> Adapter
    Adapter --> PG
    PG --- RLS
    Repo --> InferTS
    InferTS --> InferPY
    InferTS -.->|on failure| Fallback
```

### Layer responsibilities

| Layer | Role |
|-------|------|
| **UI** | Dashboard, zone management, analysis charts, simulation forms, PDF/CSV export |
| **API** | Validation, aggregation, persistence, orchestration of ML inference |
| **Repository** | Domain operations: zones, AQI storage, correlations, simulations |
| **ML (offline train, online infer)** | scikit-learn models trained in Python; runtime inference via `python3 infer.py` |
| **Supabase** | Canonical storage, auth-ready schema, RLS for read/write policies |
| **Maps** | CARTO raster tiles (API key required in production since 2026) + client-side geometry |

---

## Data flow

### End-to-end: open dashboard for a city

```mermaid
sequenceDiagram
    actor User
    participant UI as Dashboard UI
    participant Ctx as CityContext
    participant API as GET /api/dashboard/summary
    participant Repo as repository
    participant DB as Supabase
    participant ML as infer.py

    User->>UI: Open /dashboard
    UI->>Ctx: Read selected cityId
    UI->>API: Fetch summary (city scoped)
    API->>Repo: listZonesByCity + AQI
    Repo->>DB: SELECT zones, estimates
    loop Each zone (if needed)
        Repo->>ML: predictZoneAQI (stdin JSON)
        ML-->>Repo: estimated_aqi, contributions
    end
    Repo-->>API: aggregates + zone list
    API-->>UI: JSON summary
    UI->>User: Map polygons + KPI cards
```

### Zone creation and estimate persistence

```mermaid
sequenceDiagram
    participant UI as Zones / ZoneForm
    participant API as POST /api/zones
    participant DB as Supabase
    participant Est as POST /api/aqi/estimate

    UI->>API: Create zone (features + geometry)
    API->>DB: INSERT zones
    DB-->>API: zone row
    UI->>Est: Request estimate for zone_id
    Est->>DB: Read zone, run ML, INSERT aqi_estimates
    Est-->>UI: AQIEstimate + category
```

### Simulation run

```mermaid
flowchart TD
    A[User configures scenario<br/>traffic ↓, green ↑, reroute] --> B[POST /api/simulation/run]
    B --> C[Load baseline zone + latest AQI]
    C --> D[Apply deterministic adjustment model]
    D --> E[INSERT simulation_scenarios]
    D --> F[INSERT simulation_results]
    F --> G[UI: before / after / delta / recommendation]
```

---

## User journeys

```mermaid
journey
    title Planner workflow (typical session)
    section Orient
      Land on Home: 5: User
      Pick city in nav: 4: User
      Open Dashboard map: 5: User
    section Understand
      Inspect zone popup AQI: 4: User
      Open Analysis correlations: 4: User
    section Act
      Create or edit zones: 3: User
      Run Simulation scenario: 4: User
      Export PDF/CSV report: 5: User
```

```mermaid
flowchart LR
    subgraph Entry
        H[Home /]
    end

    subgraph Core
        D[Dashboard]
        Z[Zones]
        A[Analysis]
        S[Simulation]
    end

    subgraph Actions
        AC[Add city modal]
        EX[Export modal]
    end

    H --> D
    H --> Z
    D --> A
    D --> S
    Z --> D
    AC -.-> D
    EX -.-> D
```

---

## Database model

Run migrations in order under `web/supabase/migrations/` (see [backend setup](./web/SUPABASE_BACKEND_SETUP.md)).

```mermaid
erDiagram
    cities ||--o{ zones : "city_id"
    zones ||--o{ aqi_estimates : "zone_id"
    zones ||--o{ simulation_scenarios : "zone_id"
    simulation_scenarios ||--|| simulation_results : "scenario_id"
    auth_users ||--o{ zones : "created_by"

    cities {
        text id PK
        text name
        numeric center_lat
        numeric center_lng
        int zoom
    }

    zones {
        uuid id PK
        text city_id FK
        text name
        land_use_type land_use_type
        int traffic_density
        int population_density
        numeric road_length
        jsonb geometry
        text notes
    }

    aqi_estimates {
        bigint id PK
        uuid zone_id FK
        int estimated_aqi
        aqi_category category
        jsonb feature_contributions
        text assumptions
    }

    simulation_scenarios {
        uuid id PK
        uuid zone_id FK
        text name
        int vehicle_reduction_percentage
        int green_cover_increase
        numeric traffic_rerouting_factor
    }

    simulation_results {
        uuid id PK
        uuid scenario_id FK
        int before_aqi
        int after_aqi
        int delta
        numeric delta_percentage
        text recommendation
    }
```

**Enums:** `land_use_type` (residential, commercial, industrial, green_space, mixed), `aqi_category` (good, satisfactory, moderate, poor, severe).

---

## Machine learning pipeline

ML is **supportive and interpretable** — the app remains usable via formula-based fallback if Python inference fails.

```mermaid
flowchart LR
    subgraph Offline["Offline (developer machine)"]
        CSV[dataset.csv]
        T1[train_aqi_model.py]
        T2[train_cluster_model.py]
        ART[Serialized models<br/>joblib / artifacts]
        CSV --> T1
        CSV --> T2
        T1 --> ART
        T2 --> ART
    end

    subgraph Online["Online (API request)"]
        Z[Zone features]
        INF[infer.py]
        OUT[AQI + category + cluster_id + contributions]
        Z --> INF
        ART -.-> INF
        INF --> OUT
    end

    subgraph Safety["Resilience"]
        FB[fallback.ts<br/>weighted formula]
        OUT -.->|spawn error| FB
    end
```

| Stage | Script / module | Output |
|-------|-----------------|--------|
| Train regression | `web/lib/ml/train_aqi_model.py` | AQI prediction model |
| Train clustering | `web/lib/ml/train_cluster_model.py` | Zone pollution archetypes |
| Runtime | `web/lib/ml/inference.ts` → `infer.py` | JSON estimate per zone |
| Fallback | `web/lib/ml/fallback.ts` | Deterministic estimate + contributions |

**Feature inputs (conceptual):** traffic density, population density, road length, land use type, derived ambient proxies (temperature, humidity, time-of-day).

---

## Application surface

| Route | Purpose |
|-------|---------|
| `/` | Landing and product overview |
| `/dashboard` | City KPIs, zone map, quick zone actions |
| `/zones` | Zone list with latest AQI |
| `/zones/new`, `/zones/[id]`, `/zones/[id]/edit` | Create and manage zones |
| `/analysis` | Correlation views and cluster insights |
| `/simulation` | Scenario builder and results |
| `/cities` | City management (where enabled) |

**Shared UI:** `CityContext` (persisted city selection), `NavBar` (city switcher, add city, export), `zone-map` (Leaflet), `ExportModal` (CSV/PDF).

---

## API reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/zones` | List zones (optional city filter) |
| `POST` | `/api/zones` | Create zone |
| `GET` | `/api/zones/[id]` | Zone detail + latest estimate |
| `PUT` / `DELETE` | `/api/zones/[id]` | Update / delete zone |
| `POST` | `/api/aqi/estimate` | Run estimate and store `aqi_estimates` |
| `GET` | `/api/dashboard/summary` | Dashboard aggregates for active city |
| `GET` | `/api/analysis/correlations` | Feature ↔ AQI correlation table |
| `GET` | `/api/analysis/clusters` | Cluster assignments / summaries |
| `POST` | `/api/simulation/run` | Persist scenario + results |
| `GET` | `/api/cities` | List cities |
| `GET` | `/api/reports/summary` | Data bundle for export modal |

Server routes use `SUPABASE_SERVICE_ROLE_KEY` for trusted writes; see RLS notes in [SUPABASE_BACKEND_SETUP.md](./web/SUPABASE_BACKEND_SETUP.md).

---

## Technology stack

```mermaid
pie showData
    title Codebase focus (by concern)
    "Next.js UI + API" : 45
    "Data + Supabase" : 20
    "Maps + visualization" : 15
    "ML (Python + bridge)" : 12
    "Migrations + docs" : 8
```

| Area | Choices |
|------|---------|
| Framework | Next.js (App Router), React, TypeScript |
| Styling | Tailwind CSS, Radix / shadcn-style components |
| Maps | Leaflet, GeoJSON zone geometry, CARTO basemaps |
| Data | Supabase (PostgreSQL, Auth, RLS) |
| ML | Python 3, pandas, scikit-learn; Node `spawnSync` bridge |
| Export | jsPDF, jspdf-autotable, client-side CSV |
| Hosting | Vercel (typical), Supabase cloud |

---

## Repository layout

```
breathe-map/
├── README.md                 ← you are here
├── PRD.md                    ← product requirements
├── LICENSE
└── web/                      ← Next.js application (monorepo root for app code)
    ├── app/                  ← pages + API route handlers
    ├── components/           ← UI, map, modals, forms
    ├── context/              ← CityContext
    ├── lib/
    │   ├── db/               ← adapter + repository
    │   ├── ml/               ← train scripts, infer.py, inference.ts, fallback
    │   ├── supabase/         ← server client + env helpers
    │   └── cartoBasemap.ts   ← CARTO tile URLs + API key
    ├── supabase/migrations/  ← SQL schema (run in order)
    ├── .env.example
    └── SUPABASE_BACKEND_SETUP.md
```

*Legacy docs may mention `/frontend` and `/ml` at repo root; the active app and ML code live under `web/`.*

---

## Local development

### Prerequisites

- Node.js 18+  
- npm  
- Python 3 with scikit-learn stack (for ML inference)  
- Supabase project (URL + keys)  
- [CARTO Basemaps API key](https://carto.com/basemaps/apikey) (required for map tiles in dev/production)

### Setup

```bash
cd web
cp .env.example .env.local
# Edit .env.local — Supabase + NEXT_PUBLIC_CARTO_BASEMAPS_API_KEY

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database

Apply SQL migrations in Supabase SQL Editor **in filename order**:

1. `20260217_init_breathe_map.sql`  
2. `20260301_add_city_scope.sql`  
3. `20260302_cities_and_geometry.sql`  
4. `20260401_add_satisfactory_category.sql`  

Details: [web/SUPABASE_BACKEND_SETUP.md](./web/SUPABASE_BACKEND_SETUP.md).

### ML (optional refresh)

```bash
cd web/lib/ml
python3 train_aqi_model.py
python3 train_cluster_model.py
python3 test_models.py
```

---

## Deployment

Typical production layout:

```mermaid
flowchart LR
    GH[GitHub repo] -->|push main| VER[Vercel build]
    VER --> APP[Next.js serverless]
    APP --> SB[(Supabase)]
    APP --> CARTO[CARTO tiles]
    Browser --> APP
    Browser --> CARTO
```

1. Connect the GitHub repository to Vercel with **root directory** `web` (if the project is not already configured that way).  
2. Set environment variables in Vercel (Production + Preview):

   | Variable | Required |
   |----------|----------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Yes |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
   | `SUPABASE_SERVICE_ROLE_KEY` | Yes (server only) |
   | `NEXT_PUBLIC_CARTO_BASEMAPS_API_KEY` | Yes (map tiles) |

3. Ensure Supabase migrations are applied on the linked project.  
4. Push to `main` — Vercel redeploys automatically.

**Fork workflow:** push to your fork → open PR to [a23droid/breathe-map](https://github.com/a23droid/breathe-map) → after merge, sync fork with `git fetch upstream && git merge upstream/main && git push origin main`.

---

## Scope, ethics & disclaimer

### In scope

- Planning, simulation, and exploratory analytics  
- Transparent estimates with documented assumptions  
- Multi-city, zone-level visualization  

### Out of scope

- Real-time sensor networks  
- Legal/regulatory AQI certification  
- Individual tracking or enforcement  

### Ethics

- Results are **model estimates**, not ground-truth measurements.  
- Correlations are **descriptive**, not causal claims.  
- Use outputs to **inform** dialogue and prioritization, not to penalize communities or individuals.

### Disclaimer

Breathe Map is for **academic, research, and urban planning simulation** only. Do not use it as a substitute for certified monitoring, emergency alerting, or regulatory compliance.

---

## Contributing

1. Fork the repository and create a feature branch.  
2. Keep changes focused; match existing TypeScript and SQL migration patterns.  
3. Update docs when adding env vars, API routes, or migrations.  
4. Open a pull request against `a23droid/breathe-map` with a short test plan.

For product behavior and acceptance criteria, see [PRD.md](./PRD.md).

---

<p align="center">
  <sub>Breathe Map — intelligent air for smart cities</sub>
</p>
