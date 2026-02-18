import { NextResponse } from 'next/server'
import { getCorrelationsFromEstimates, getLatestAQIForZones, listZones } from '@/lib/db/repository'

export async function GET() {
  try {
    const zones = await listZones()
    const estimates = await getLatestAQIForZones(zones)
    const correlations = getCorrelationsFromEstimates(zones, estimates)

    return NextResponse.json({
      data: correlations,
      sample_size: zones.length,
      disclaimer:
        'Correlations are exploratory and computed from deterministic AQI model outputs. They are not causal evidence.',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Correlation analysis error:', error)
    return NextResponse.json({ error: 'Failed to generate correlations' }, { status: 500 })
  }
}
