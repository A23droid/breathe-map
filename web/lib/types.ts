/**
 * Core type definitions for Breathe Map
 * All data is mock/simulated - no real sensor data
 */

export type LandUseType =
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'green_space'
  | 'mixed'

export type AQICategory = 'good' | 'satisfactory' | 'moderate' | 'poor' | 'severe'

export interface Zone {
  id: string
  name: string
  land_use_type: LandUseType
  traffic_density: number // 0-100
  population_density: number // 0-100
  road_length: number // km
  notes: string
  city_id?: string
  geometry?: unknown | null
  created_at: string
}

export interface City {
  id: string
  name: string
  center_lat?: number
  center_lng?: number
  zoom?: number
}

export interface ReportZoneRow {
  id: string
  name: string
  land_use_type: LandUseType
  traffic_density: number
  population_density: number
  road_length: number
  notes: string
  created_at: string
  estimated_aqi: number | null
  category: AQICategory | null
  feature_contributions?: {
    traffic: number
    population: number
    road_network: number
    land_use: number
  } | null
}

export interface ReportSimulationSummary {
  total_runs: number
  average_delta: number
  best_delta: number
  latest_run_at: string | null
  latest_scenario_name: string | null
}

export interface SummaryReport {
  city: City
  overview: {
    zone_count: number
    average_aqi: number
    highest_aqi: number
    lowest_aqi: number
  }
  distribution: {
    good: number
    satisfactory: number
    moderate: number
    poor: number
    severe: number
  }
  zones: ReportZoneRow[]
  simulation_summary: ReportSimulationSummary
  generated_at: string
  filters: {
    city_id: string
    date_from: string | null
    date_to: string | null
    zone_ids: string[]
  }
}

export interface AQIEstimate {
  zone_id: string
  estimated_aqi: number
  category: AQICategory
  feature_contributions: {
    traffic: number
    population: number
    road_network: number
    land_use: number
  }
  assumptions: string
  timestamp: string
}

export interface AQICorrelation {
  factor: string
  correlation_coefficient: number
  description: string
}

export interface ZoneCluster {
  cluster_id: number
  zones: string[]
  average_aqi: number
  dominant_land_use: LandUseType
  characteristics: string
}

export interface SimulationScenario {
  id: string
  zone_id: string
  name: string
  vehicle_reduction_percentage: number // 0-100
  green_cover_increase: number // 0-100
  traffic_rerouting_factor: number // 0-1
  created_at: string
}

export interface SimulationResult {
  scenario_id: string
  zone_id: string
  before_aqi: number
  after_aqi: number
  delta: number
  delta_percentage: number
  explanation: string
  recommendation: string
  timestamp: string
}

/**
 * Placeholder interfaces for future database/ML integration
 */

export interface DatabaseAdapter {
  zones: {
    getAll(cityId?: string): Promise<Zone[]>
    getById(id: string, cityId?: string): Promise<Zone | null>
    create(zone: Omit<Zone, 'id' | 'created_at'>): Promise<Zone>
    update(id: string, zone: Partial<Zone>): Promise<Zone>
    delete(id: string): Promise<void>
  }
  aqi: {
    estimate(zone: Zone): Promise<AQIEstimate>
    getHistorical(zoneId: string): Promise<AQIEstimate[]>
  }
}

export interface MLModel {
  /**
   * Would load a trained model for AQI prediction
   * Currently uses mock estimation logic
   */
  estimateAQI(zone: Zone): Promise<number>
  /**
   * Would perform real ML clustering
   * Currently returns mock clusters
   */
  clusterZones(zones: Zone[]): Promise<ZoneCluster[]>
}
