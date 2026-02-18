-- Extensions
create extension if not exists pgcrypto;

-- Enums
create type public.land_use_type as enum (
  'residential',
  'commercial',
  'industrial',
  'green_space',
  'mixed'
);

create type public.aqi_category as enum ('good', 'moderate', 'poor', 'severe');

-- Core tables
create table public.zones (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  land_use_type public.land_use_type not null,
  traffic_density integer not null check (traffic_density between 0 and 100),
  population_density integer not null check (population_density between 0 and 100),
  road_length numeric(8,2) not null check (road_length >= 0),
  notes text not null default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.aqi_estimates (
  id bigserial primary key,
  zone_id uuid not null references public.zones(id) on delete cascade,
  estimated_aqi integer not null check (estimated_aqi between 0 and 500),
  category public.aqi_category not null,
  feature_contributions jsonb not null,
  assumptions text not null,
  source text not null default 'model_v1',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.simulation_scenarios (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.zones(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 120),
  vehicle_reduction_percentage integer not null check (vehicle_reduction_percentage between 0 and 100),
  green_cover_increase integer not null check (green_cover_increase between 0 and 100),
  traffic_rerouting_factor numeric(4,3) not null check (traffic_rerouting_factor >= 0 and traffic_rerouting_factor <= 1),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.simulation_results (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null unique references public.simulation_scenarios(id) on delete cascade,
  zone_id uuid not null references public.zones(id) on delete cascade,
  before_aqi integer not null check (before_aqi between 0 and 500),
  after_aqi integer not null check (after_aqi between 0 and 500),
  delta integer not null,
  delta_percentage numeric(6,2) not null,
  explanation text not null,
  recommendation text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Indexes
create index zones_created_at_idx on public.zones (created_at desc);
create index aqi_estimates_zone_created_at_idx on public.aqi_estimates (zone_id, created_at desc);
create index simulation_scenarios_zone_created_at_idx on public.simulation_scenarios (zone_id, created_at desc);
create index simulation_results_zone_created_at_idx on public.simulation_results (zone_id, created_at desc);

-- Trigger for updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_zones_updated_at
before update on public.zones
for each row
execute function public.set_updated_at();

-- RLS
alter table public.zones enable row level security;
alter table public.aqi_estimates enable row level security;
alter table public.simulation_scenarios enable row level security;
alter table public.simulation_results enable row level security;

-- Public read access for dashboard/analysis views (via anon key).
create policy "zones_select_public"
on public.zones for select
using (true);

create policy "aqi_estimates_select_public"
on public.aqi_estimates for select
using (true);

create policy "simulation_scenarios_select_public"
on public.simulation_scenarios for select
using (true);

create policy "simulation_results_select_public"
on public.simulation_results for select
using (true);

-- Authenticated direct writes (if you later use client-side Supabase with auth).
create policy "zones_insert_authenticated"
on public.zones for insert
with check (auth.role() = 'authenticated' and created_by = auth.uid());

create policy "zones_update_owner"
on public.zones for update
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy "zones_delete_owner"
on public.zones for delete
using (created_by = auth.uid());

create policy "aqi_estimates_insert_authenticated"
on public.aqi_estimates for insert
with check (auth.role() = 'authenticated' and created_by = auth.uid());

create policy "simulation_scenarios_insert_authenticated"
on public.simulation_scenarios for insert
with check (auth.role() = 'authenticated' and created_by = auth.uid());

create policy "simulation_results_insert_authenticated"
on public.simulation_results for insert
with check (auth.role() = 'authenticated' and created_by = auth.uid());
