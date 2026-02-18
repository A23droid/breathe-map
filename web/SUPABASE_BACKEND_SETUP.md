# Supabase Backend Setup (Breathe Map)

## 1) Create project and collect keys
1. Create a project in [Supabase](https://supabase.com/).
2. Open `Project Settings -> API`.
3. Copy:
- Project URL
- `anon` public key
- `service_role` key

## 2) Configure env vars
Create `web/.env.local` from `web/.env.example` and fill values:

```bash
cp .env.example .env.local
```

## 3) Create database schema
Run SQL in Supabase SQL Editor from:
- `web/supabase/migrations/20260217_init_breathe_map.sql`

This migration creates:
- enums: `land_use_type`, `aqi_category`
- tables: `zones`, `aqi_estimates`, `simulation_scenarios`, `simulation_results`
- indexes and `updated_at` trigger
- RLS policies

## 4) Install dependencies and run app
```bash
npm install
npm run dev
```

## 5) Page-by-page backend mapping
- `/` Home: no DB calls.
- `/zones`: `GET /api/zones` -> reads `zones`, computes/fetches latest `aqi_estimates` per zone.
- `/zones/new`: `POST /api/zones` -> inserts into `zones`.
- `/zones/[id]`: `GET /api/zones/:id` -> reads one zone + latest AQI estimate.
- `/dashboard`: `GET /api/dashboard/summary` -> aggregate stats from zones + latest estimates.
- `/analysis`: 
  - `GET /api/analysis/correlations` -> computes correlations from stored zone and estimate data.
  - `GET /api/analysis/clusters` -> clusters zones by land-use and AQI behavior.
- `/simulation`: 
  - `GET /api/zones` for selector.
  - `POST /api/simulation/run` -> reads zone, computes result, stores into `simulation_scenarios` and `simulation_results`.

## 6) RLS policy model used
- Public read policies are enabled for all 4 tables (good for open dashboard/demo usage).
- Authenticated write policies are included (owner-based writes where `created_by = auth.uid()`).
- Server APIs use `SUPABASE_SERVICE_ROLE_KEY` so backend routes can write without client-side auth.

## 7) Recommended next hardening
1. Add authentication and set `created_by` from session user.
2. Remove public `select` policies if data should be private.
3. Add update/delete UI for zones.
4. Add pagination for zone lists when data grows.
