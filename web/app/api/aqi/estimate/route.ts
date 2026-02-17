import { NextRequest, NextResponse } from 'next/server'
import { getZoneById, storeAQIEstimate } from '@/lib/db/repository'

/**
 * POST /api/aqi/estimate
 * Estimates AQI for a given zone using deterministic model and stores result
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
    const { zone_id } = body as { zone_id: string }

    if (!zone_id) {
      return NextResponse.json(
        { error: 'zone_id is required' },
        { status: 400 }
      )
    }

    const zone = await getZoneById(zone_id)
    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 })
    }

    const estimate = await storeAQIEstimate(zone)

    return NextResponse.json(estimate)
  } catch (error) {
    console.error('AQI estimation error:', error)
    return NextResponse.json(
      { error: 'Failed to estimate AQI' },
      { status: 500 }
    )
  }
}
