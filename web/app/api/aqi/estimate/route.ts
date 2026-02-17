import { NextRequest, NextResponse } from 'next/server'
import { Zone, AQIEstimate } from '@/lib/types'
import {
  calculateMockAQI,
  getAQICategory,
  getFeatureContributions,
} from '@/lib/mock-data'

/**
 * POST /api/aqi/estimate
 * Estimates AQI for a given zone using mock calculation
 * 
 * Request body:
 * {
 *   zone: Zone object
 * }
 * 
 * Response:
 * {
 *   estimated_aqi: number
 *   category: 'good' | 'moderate' | 'poor' | 'severe'
 *   feature_contributions: { traffic, population, road_network, land_use }
 *   assumptions: string
 *   timestamp: ISO string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { zone } = body as { zone: Zone }

    if (!zone || !zone.id) {
      return NextResponse.json(
        { error: 'Invalid zone data provided' },
        { status: 400 }
      )
    }

    // Calculate mock AQI using deterministic formula
    const aqi = calculateMockAQI(zone)
    const category = getAQICategory(aqi)
    const contributions = getFeatureContributions(zone)

    const estimate: AQIEstimate = {
      zone_id: zone.id,
      estimated_aqi: aqi,
      category,
      feature_contributions: contributions,
      assumptions: `AQI estimation based on mock weighted factors:
      • Traffic density (40%): ${zone.traffic_density}%
      • Population density (20%): ${zone.population_density}%
      • Road network length (20%): ${zone.road_length} km
      • Land use type (20%): ${zone.land_use_type}
      
      DISCLAIMER: This is a simplified educational model. Real AQI requires calibrated sensors and atmospheric data. Results are estimates only.`,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(estimate)
  } catch (error) {
    console.error('AQI estimation error:', error)
    return NextResponse.json(
      { error: 'Failed to estimate AQI' },
      { status: 500 }
    )
  }
}
