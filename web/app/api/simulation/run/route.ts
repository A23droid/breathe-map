import { NextRequest, NextResponse } from 'next/server'
import { Zone, SimulationResult } from '@/lib/types'
import { calculateMockAQI, getAQICategory, simulateReduction } from '@/lib/mock-data'

/**
 * POST /api/simulation/run
 * Simulates AQI reduction based on intervention parameters
 * Uses the same transparent logic as AQI estimation
 * 
 * Request body:
 * {
 *   zone: Zone object,
 *   vehicle_reduction_percentage: number (0-100),
 *   green_cover_increase: number (0-100),
 *   traffic_rerouting_factor: number (0-1)
 * }
 * 
 * Response:
 * {
 *   before_aqi: number,
 *   after_aqi: number,
 *   delta: number,
 *   delta_percentage: number,
 *   explanation: string,
 *   recommendation: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      zone,
      vehicle_reduction_percentage = 0,
      green_cover_increase = 0,
      traffic_rerouting_factor = 0,
    } = body as {
      zone: Zone
      vehicle_reduction_percentage: number
      green_cover_increase: number
      traffic_rerouting_factor: number
    }

    if (!zone || !zone.id) {
      return NextResponse.json(
        { error: 'Invalid zone data provided' },
        { status: 400 }
      )
    }

    // Validate input ranges
    if (
      vehicle_reduction_percentage < 0 ||
      vehicle_reduction_percentage > 100 ||
      green_cover_increase < 0 ||
      green_cover_increase > 100 ||
      traffic_rerouting_factor < 0 ||
      traffic_rerouting_factor > 1
    ) {
      return NextResponse.json(
        { error: 'Invalid parameter ranges' },
        { status: 400 }
      )
    }

    // Calculate baseline AQI
    const beforeAQI = calculateMockAQI(zone)

    // Simulate reduction
    const afterAQI = simulateReduction(
      beforeAQI,
      vehicle_reduction_percentage,
      green_cover_increase,
      traffic_rerouting_factor
    )

    const delta = beforeAQI - afterAQI
    const deltaPercentage = (delta / beforeAQI) * 100

    // Generate explanation
    const factors = []
    if (vehicle_reduction_percentage > 0) {
      factors.push(
        `${vehicle_reduction_percentage}% vehicle reduction contributes ~${Math.round((vehicle_reduction_percentage / 100) * beforeAQI * 0.4)}pts`
      )
    }
    if (green_cover_increase > 0) {
      factors.push(`${green_cover_increase}% green increase contributes ~${Math.round(green_cover_increase * 0.5)}pts`)
    }
    if (traffic_rerouting_factor > 0) {
      factors.push(`Traffic rerouting factor: ${traffic_rerouting_factor.toFixed(2)}`)
    }

    const explanation =
      factors.length > 0
        ? `Estimated reduction breakdown: ${factors.join('; ')}`
        : 'No interventions applied in this scenario'

    // Generate recommendation
    let recommendation = ''
    if (deltaPercentage < 5) {
      recommendation =
        'Minimal impact expected. Consider combining interventions for greater effect.'
    } else if (deltaPercentage < 15) {
      recommendation =
        'Modest improvement possible. Monitor real-world implementation effectiveness.'
    } else if (deltaPercentage < 30) {
      recommendation =
        'Significant improvement potential. Worth implementing with regular monitoring.'
    } else {
      recommendation =
        'Substantial improvement projected. This represents a meaningful environmental intervention.'
    }

    const result: SimulationResult = {
      scenario_id: `sim-${Date.now()}`,
      zone_id: zone.id,
      before_aqi: beforeAQI,
      after_aqi: afterAQI,
      delta,
      delta_percentage: Math.round(deltaPercentage * 10) / 10,
      explanation,
      recommendation,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Simulation error:', error)
    return NextResponse.json({ error: 'Failed to run simulation' }, { status: 500 })
  }
}
