# 🌬️ Breathe Map
## Smart-City Decision Support System for Hyperlocal Air Quality Planning

Breathe Map is a **smart-city decision support web application** designed to assist urban planners,
city administrators, and researchers in **understanding, analyzing, and planning interventions**
for urban air quality at a **hyperlocal level**.

The system estimates air quality using historical and proxy data, correlates pollution patterns
with urban characteristics, and simulates the potential impact of emission-reduction strategies.
It is intended for **planning, evaluation, and policy support**, not real-time monitoring
or regulatory enforcement.

---

## 1. Problem Context

Urban air pollution is a major challenge in modern cities, affecting public health,
mobility, and sustainability goals. While most cities publish aggregated AQI values,
these coarse measurements fail to capture **hyperlocal variation** caused by traffic density,
land use, and built environment characteristics.

Furthermore, policymakers often lack tools to **evaluate the potential impact of interventions**
before implementation, leading to reactive or ineffective strategies.

---

## 2. Problem Statement

Design a smart-city decision support system that estimates hyperlocal air quality,
correlates pollution with likely urban sources, and simulates the impact of
emission-reduction strategies to support data-driven environmental planning.

---

## 3. Objectives

- Estimate AQI at a **zone / ward / grid level** within a city
- Identify **likely contributing urban factors** (traffic, land use, density)
- Simulate emission-reduction strategies using scenario-based analysis
- Provide interpretable visualizations for **urban planning decisions**
- Maintain academic rigor while remaining technically feasible

---

## 4. Key Features

### 4.1 Hyperlocal AQI Estimation
- Zone-level AQI estimation using historical data and urban proxies
- Spatial visualization via interactive heatmaps
- Transparent, explainable estimation logic

### 4.2 Pollution Pattern Analysis
- Correlation of AQI values with traffic, land-use, and population indicators
- Clustering of zones with similar pollution signatures
- Results are **descriptive and exploratory**, not causal

### 4.3 Emission Reduction Scenario Simulation
- Configurable scenarios (traffic reduction, green cover increase, energy transition)
- Before/after AQI comparison
- Zone-wise and city-wide impact summaries

### 4.4 Decision Support Dashboard
- City-wide air quality overview
- Identification of high-risk zones
- Comparative evaluation of mitigation strategies

### 4.5 Reporting
- Exportable planning summaries (CSV / PDF-ready)
- Designed for inclusion in planning documents and reports

---

## 5. Technology Stack

### Application Layer
- **Next.js (App Router)** – frontend, backend logic, and server actions
- **Tailwind CSS** – consistent, professional UI design

### Data Layer
- **Supabase** (PostgreSQL + Auth)
- Row Level Security for controlled access

### Data Science & ML
- **Python (offline training)**
- Pandas, NumPy
- scikit-learn (Linear Regression, K-Means)

---

## 6. Machine Learning Strategy

Machine learning is used as a **supportive and interpretable enhancement**, not as a
black-box decision maker.

- Regression models improve AQI estimation accuracy
- Clustering reveals spatial pollution patterns
- Models are trained offline and integrated into application logic
- System remains functional without ML if required

---

## 7. System Scope & Non-Goals

### In Scope
- Planning and simulation
- Exploratory analytics
- Academic and policy evaluation use

### Out of Scope
- Real-time sensor ingestion
- Causal source apportionment
- Long-term pollution forecasting
- Automated enforcement or citizen surveillance

---

## 8. Target Users

- Urban planning departments
- Smart city research teams
- Policy analysts
- Academic evaluators

---

## 9. Repository Structure

/frontend        → Next.js application  
/ml              → Offline ML training scripts  
/docs            → Documentation and references  
README.md  
PRD.md  

---

## 10. Ethical & Practical Considerations

- Results are **estimates**, not measurements
- Outputs are intended to **inform**, not dictate, decisions
- The system avoids individual-level data and surveillance

---

## 11. Disclaimer

Breathe Map is designed for **academic, research, and planning simulation purposes only**.
It should not be used as a real-time monitoring or regulatory enforcement system.