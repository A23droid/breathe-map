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

export type AQICategory = 'good' | 'moderate' | 'poor' | 'severe'

export interface Zone {
  id: string
  name: string
  land_use_type: LandUseType
  traffic_density: number // 0-100
  population_density: number // 0-100
  road_length: number // km
  notes: string
  created_at: string
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
    getAll(): Promise<Zone[]>
    getById(id: string): Promise<Zone | null>
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
