/**
 * Mock/In-Memory Data for Breathe Map
 * This demonstrates the structure for future database integration
 */

import { Zone, AQIEstimate, ZoneCluster, AQICorrelation } from './types'

// In-memory storage (replace with database later)
export let mockZones: Zone[] = [
  {
    id: '1',
    name: 'Downtown Commercial',
    land_use_type: 'commercial',
    traffic_density: 85,
    population_density: 75,
    road_length: 12.5,
    notes: 'High traffic corridor with mixed commercial use',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    name: 'Residential North',
    land_use_type: 'residential',
    traffic_density: 35,
    population_density: 60,
    road_length: 8.2,
    notes: 'Primarily residential neighborhood with moderate traffic',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    name: 'Industrial Park',
    land_use_type: 'industrial',
    traffic_density: 60,
    population_density: 15,
    road_length: 18.7,
    notes: 'Manufacturing and logistics facilities',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    name: 'Green Valley',
    land_use_type: 'green_space',
    traffic_density: 10,
    population_density: 5,
    road_length: 2.1,
    notes: 'Park and recreational area with minimal development',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    name: 'Mixed Development East',
    land_use_type: 'mixed',
    traffic_density: 55,
    population_density: 45,
    road_length: 10.8,
    notes: 'Mixed-use area with residential and commercial',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

/**
 * Deterministic seeded random for consistent mock data
 */
export function seededRandom(seed: string): number {
  const x = Math.sin(seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) * 10000
  return x - Math.floor(x)
}

/**
 * Calculate mock AQI based on zone characteristics
 * Uses simple weighted calculation for transparency
 */
export function calculateMockAQI(zone: Zone, seed: string = ''): number {
  const trafficWeight = 0.4
  const populationWeight = 0.2
  const roadNetworkWeight = 0.2
  const landUseWeight = 0.2

  let baseAQI = 0

  // Traffic contribution (heavier traffic = higher AQI)
  baseAQI += (zone.traffic_density / 100) * 100 * trafficWeight

  // Population contribution
  baseAQI += (zone.population_density / 100) * 60 * populationWeight

  // Road network contribution (more roads = more emissions)
  baseAQI += Math.min((zone.road_length / 20) * 40, 40) * roadNetworkWeight

  // Land use contribution
  const landUseAQI: Record<string, number> = {
    industrial: 80,
    commercial: 70,
    mixed: 50,
    residential: 40,
    green_space: 15,
  }
  baseAQI += (landUseAQI[zone.land_use_type] || 50) * landUseWeight

  // Add small variance using seed for consistency
  const variance = seededRandom(zone.id + seed) * 10 - 5
  const finalAQI = Math.max(10, Math.min(500, baseAQI + variance))

  return Math.round(finalAQI)
}

/**
 * Determine AQI category from numeric value
 */
export function getAQICategory(aqi: number): 'good' | 'moderate' | 'poor' | 'severe' {
  if (aqi <= 50) return 'good'
  if (aqi <= 100) return 'moderate'
  if (aqi <= 150) return 'poor'
  return 'severe'
}

/**
 * Generate mock feature contributions for AQI estimate
 */
export function getFeatureContributions(zone: Zone) {
  const aqi = calculateMockAQI(zone)
  return {
    traffic: Math.round((zone.traffic_density / 100) * aqi * 0.4),
    population: Math.round((zone.population_density / 100) * aqi * 0.2),
    road_network: Math.round(Math.min((zone.road_length / 20) * aqi * 0.2, aqi * 0.2)),
    land_use: Math.round(aqi * 0.2),
  }
}

/**
 * Generate mock AQI estimates for all zones
 */
export function generateMockAQIEstimates(): Map<string, AQIEstimate> {
  const estimates = new Map<string, AQIEstimate>()

  mockZones.forEach((zone) => {
    const aqi = calculateMockAQI(zone)
    const category = getAQICategory(aqi)

    estimates.set(zone.id, {
      zone_id: zone.id,
      estimated_aqi: aqi,
      category,
      feature_contributions: getFeatureContributions(zone),
      assumptions:
        'AQI estimation based on mock weighted factors: traffic density (40%), population density (20%), road length (20%), land use type (20%). Results are simulated for educational purposes only.',
      timestamp: new Date().toISOString(),
    })
  })

  return estimates
}

/**
 * Mock correlation analysis data
 */
export const mockCorrelations: AQICorrelation[] = [
  {
    factor: 'Traffic Density',
    correlation_coefficient: 0.82,
    description: 'Strong positive correlation with vehicle emissions',
  },
  {
    factor: 'Green Coverage',
    correlation_coefficient: -0.71,
    description: 'Moderate negative correlation with vegetation filtering',
  },
  {
    factor: 'Population Density',
    correlation_coefficient: 0.56,
    description: 'Moderate positive correlation with human activity',
  },
  {
    factor: 'Road Network Length',
    correlation_coefficient: 0.64,
    description: 'Moderate positive correlation with traffic infrastructure',
  },
  {
    factor: 'Industrial Presence',
    correlation_coefficient: 0.73,
    description: 'Strong positive correlation with emission sources',
  },
]

/**
 * Generate mock zone clusters based on land use and AQI similarity
 */
export function generateMockClusters(
  estimates: Map<string, AQIEstimate>
): ZoneCluster[] {
  const clusters: ZoneCluster[] = []

  // Cluster 1: High-pollution zones (commercial + industrial)
  const highPollution = mockZones.filter(
    (z) => z.land_use_type === 'commercial' || z.land_use_type === 'industrial'
  )
  if (highPollution.length > 0) {
    clusters.push({
      cluster_id: 1,
      zones: highPollution.map((z) => z.id),
      average_aqi: Math.round(
        highPollution.reduce((sum, z) => sum + (estimates.get(z.id)?.estimated_aqi || 0), 0) /
          highPollution.length
      ),
      dominant_land_use: 'commercial',
      characteristics: 'High-traffic urban centers with elevated pollution levels',
    })
  }

  // Cluster 2: Moderate zones (residential + mixed)
  const moderate = mockZones.filter(
    (z) => z.land_use_type === 'residential' || z.land_use_type === 'mixed'
  )
  if (moderate.length > 0) {
    clusters.push({
      cluster_id: 2,
      zones: moderate.map((z) => z.id),
      average_aqi: Math.round(
        moderate.reduce((sum, z) => sum + (estimates.get(z.id)?.estimated_aqi || 0), 0) /
          moderate.length
      ),
      dominant_land_use: 'residential',
      characteristics: 'Mixed-use areas with moderate pollution and traffic patterns',
    })
  }

  // Cluster 3: Clean zones (green space)
  const clean = mockZones.filter((z) => z.land_use_type === 'green_space')
  if (clean.length > 0) {
    clusters.push({
      cluster_id: 3,
      zones: clean.map((z) => z.id),
      average_aqi: Math.round(
        clean.reduce((sum, z) => sum + (estimates.get(z.id)?.estimated_aqi || 0), 0) /
          clean.length
      ),
      dominant_land_use: 'green_space',
      characteristics: 'Protected natural areas with minimal pollution',
    })
  }

  return clusters
}

/**
 * Simulate pollution reduction based on scenario parameters
 * Simple linear model for transparency
 */
export function simulateReduction(
  baseAQI: number,
  vehicleReduction: number,
  greenIncrease: number,
  reroutingFactor: number
): number {
  // Vehicle reduction (40% of AQI impact)
  const trafficReduction = (vehicleReduction / 100) * baseAQI * 0.4 * (1 - reroutingFactor * 0.1)

  // Green increase acts as a filter (estimated 0.5 AQI point per 1% green increase)
  const greenReduction = greenIncrease * 0.5

  // Rerouting has marginal benefit if not accompanied by actual traffic reduction
  const rerouteReduction = reroutingFactor * 5

  const totalReduction = trafficReduction + greenReduction + rerouteReduction
  return Math.max(10, baseAQI - totalReduction)
}
