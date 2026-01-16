# Product Requirements Document (PRD)

## **Breathe Map**  
*Intelligent Air for Smart Cities*

**Designing Cleaner Urban Air**

---

## 1. Overview

**Breathe Map** is a smart-city decision support system that enables urban planners and administrators to:

- Estimate hyperlocal air quality (AQI) at zone/ward/grid levels  
- Correlate pollution levels with probable urban sources (traffic, land use, density, etc.)  
- Simulate the impact of emission-reduction strategies  

The focus is on **planning intelligence** and scenario exploration — not real-time monitoring, enforcement, or regulatory use.  
It is designed for academic, research, and smart-city design contexts.

---

## 2. Problem Statement

Cities need better tools to understand hyperlocal air pollution patterns and evaluate mitigation options before implementation.  
Existing systems often lack fine-grained estimation, source insight, or what-if simulation — especially under academic/hackathon constraints.

**Breathe Map** addresses this by providing a lightweight, interpretable decision-support platform using proxy/historical/synthetic data.

---

## 3. Goals & Objectives

- Deliver hyperlocal AQI estimates (zone/ward/grid resolution)  
- Identify likely contributing urban factors (e.g., traffic density, land use, population)  
- Enable simulation of emission-reduction strategies (e.g., reduced vehicle volume, green corridors, zoning changes)  
- Provide transparent, interpretable, and data-driven insights for planners  
- Remain fully feasible within academic/hackathon limits (no live sensors, no complex causal inference)

---

## 4. Target Users

- Urban planning departments  
- Smart city governance & operations teams  
- Policy analysts & environmental researchers  
- Academic evaluators / hackathon judges

---

## 5. System Scope

### In Scope
- AQI estimation using historical, proxy, and synthetic data  
- Exploratory analysis of pollution patterns & correlations  
- Scenario-based simulation of emission reductions  
- Interactive dashboards, visualizations, and exportable reports  

### Out of Scope
- Real-time IoT sensor data ingestion  
- Definitive causal source attribution  
- Long-term predictive forecasting  
- Citizen-facing apps, surveillance, or enforcement features

---

## 6. High-Level Architecture

```text
Next.js (App Router)
│
├── Server Actions / API Routes
│   ├── Auth
│   ├── Zone Management
│   ├── AQI Estimation
│   ├── Pattern Analysis
│   └── Simulation Engine
│
├── Supabase
│   ├── PostgreSQL (Data + Metadata)
│   ├── Authentication
│   └── Row Level Security
│
└── Offline ML Pipeline (Python)
├── Data Prep + Feature Engineering
├── Regression (AQI estimation)
└── Clustering (Pollution pattern grouping)
```

---

## 7. Technology Stack

### Application Layer
- Next.js 14+ (App Router, Server Actions)  
- Tailwind CSS + shadcn/ui (components)

### Data Layer
- Supabase (PostgreSQL, Auth, RLS)

### Machine Learning (Offline)
- Python  
- Pandas, NumPy  
- scikit-learn (Linear/Ridge Regression, K-Means/Random Forest for clustering/explainability)

---

## 8. Machine Learning Strategy

- Models trained **offline** in Python → exported (e.g., joblib/pickle)  
- **Regression**: Improves AQI estimation from proxy features (traffic, land-use, density, weather)  
- **Clustering**: Groups zones by pollution pattern similarity  
- ML is **supportive** — system remains functional and interpretable without it  
- Emphasis on explainability (feature importance, simple models)

## 9. Key API Routes (Examples)

### Authentication
- `POST /api/auth/login`  
- `POST /api/auth/logout`  
- `GET /api/auth/session`

### Zone Management
- `GET /api/zones`  
- `GET /api/zones/{zoneId}`  
- `POST /api/zones`  
- `PUT /api/zones/{zoneId}`

### AQI Estimation
- `GET /api/aqi/base` (static/reference values)  
- `POST /api/aqi/estimate` (payload: zone features → returns estimated AQI)

### Pollution Analysis
- `GET /api/analysis/correlations`  
- `GET /api/analysis/clusters`

### Simulation Engine
- `POST /api/simulation/run` (payload: strategy params)  
- `GET /api/simulation/results/{simulationId}`

### Dashboard & Reports
- `GET /api/dashboard/overview`  
- `GET /api/reports/summary`  
- `GET /api/reports/export?format=pdf|csv`

---

## 10. Data Requirements

- Historical AQI / pollutant data (open datasets, e.g., CPCB, synthetic)  
- Proxy features: traffic density, road length, land-use classification, population density  
- Weather proxies (temperature, wind, humidity — historical or average)  
- Emission factors (standard references for vehicles, industry, etc.)  

Synthetic + open proxy data fully acceptable.

---

## 11. UI Color Palette

### Primary Colors
| Purpose            | Color        | Hex      |
|--------------------|--------------|----------|
| Primary Background | Midnight Blue| #0F172A |
| Primary Accent     | Sky Blue     | #38BDF8 |

### AQI Semantic Colors (aligned with CPCB/India standards)
| AQI Category | Range     | Color         | Hex      |
|--------------|-----------|---------------|----------|
| Good         | 0–50      | Emerald Green | #22C55E |
| Satisfactory | 51–100    | Lime          | #84CC16 |
| Moderate     | 101–200   | Amber         | #F59E0B |
| Poor         | 201–300   | Orange-Red    | #F97316 |
| Very Poor    | 301–400   | Red           | #EF4444 |
| Severe       | 401+      | Dark Red      | #7F1D1D |

### Neutral UI Colors
| Use            | Color     | Hex      |
|----------------|-----------|----------|
| Background     | Slate     | #F8FAFC |
| Cards          | White     | #FFFFFF |
| Borders        | Cool Gray | #CBD5E1 |
| Text (Primary) | Charcoal  | #1E293B |
| Text (Muted)   | Gray      | #64748B |

---

## 12. Non-Functional Requirements

- Fully responsive web application  
- Interpretable outputs (feature contributions, assumptions visible)  
- Modular & maintainable code structure  
- Secure authentication & data access (RLS)  
- Demo-ready, reproducible setup (docker-compose optional)

---

## 13. Ethical & Practical Considerations

- All outputs are **estimates/simulations**, clearly labeled as such  
- Advisory only — never prescriptive or regulatory  
- No personal, individual, or surveillance data used  
- Transparent documentation of data sources, assumptions, and limitations

---

## 14. Risks & Mitigation

| Risk                          | Mitigation                              |
|-------------------------------|-----------------------------------------|
| Overclaiming model accuracy   | Use conservative language & disclaimers |
| Incomplete/missing data       | Rely on proxies + synthetic fill        |
| Overly complex ML             | Prefer simple, explainable models       |
| Poor demo performance         | Optimize for offline/low-resource use   |

---

## 15. Success Criteria

- Accurate-feeling hyperlocal AQI variation visualization (map + charts)  
- Credible before/after comparison of mitigation scenarios  
- Positive feedback from academic evaluators / judges  
- Stable, reproducible prototype demo

---

## 16. Disclaimer

**Breathe Map** is developed for **academic, research, simulation, and educational purposes only**.  
It must **not** be used for real-time monitoring, public health alerts, regulatory decisions, or enforcement.
