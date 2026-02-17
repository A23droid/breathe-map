import { NextRequest, NextResponse } from 'next/server'
import { SimulationResult } from '@/lib/types'
import { calculateMockAQI, simulateReduction } from '@/lib/mock-data'
import { getZoneById } from '@/lib/db/repository'
import { getSupabaseServerClient } from '@/lib/supabase/server'

/**
 * POST /api/simulation/run
 * Simulates AQI reduction based on intervention parameters
 * Uses the same transparent logic as AQI estimation
 * 
 * Request body:
 * {
 *   zone_id: string,
 *   scenario_name?: string,
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
      zone_id,
      scenario_name,
      vehicle_reduction_percentage = 0,
      green_cover_increase = 0,
      traffic_rerouting_factor = 0,
    } = body as {
      zone_id: string
      scenario_name?: string
      vehicle_reduction_percentage: number
      green_cover_increase: number
      traffic_rerouting_factor: number
    }

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

    const supabase = getSupabaseServerClient()
    const { data: scenario, error: scenarioError } = await supabase
      .from('simulation_scenarios')
      .insert({
        zone_id: zone.id,
        name: scenario_name?.trim() || `Scenario ${new Date().toLocaleString('en-US')}`,
        vehicle_reduction_percentage,
        green_cover_increase,
        traffic_rerouting_factor,
      })
      .select('id')
      .single()

    if (scenarioError) throw scenarioError

    const { error: resultError } = await supabase.from('simulation_results').insert({
      scenario_id: scenario.id,
      zone_id: zone.id,
      before_aqi: result.before_aqi,
      after_aqi: result.after_aqi,
      delta: result.delta,
      delta_percentage: result.delta_percentage,
      explanation: result.explanation,
      recommendation: result.recommendation,
    })

    if (resultError) throw resultError

    result.scenario_id = scenario.id

    return NextResponse.json(result)
  } catch (error) {
    console.error('Simulation error:', error)
    return NextResponse.json({ error: 'Failed to run simulation' }, { status: 500 })
  }
}
