import { NextResponse } from 'next/server'
import { getLatestAQIForZones, listZones } from '@/lib/db/repository'

export async function GET() {
  try {
    const zones = await listZones()
    const estimateMap = await getLatestAQIForZones(zones)
    const estimates = Array.from(estimateMap.values())

    const average_aqi =
      estimates.length > 0
        ? Math.round(estimates.reduce((sum, item) => sum + item.estimated_aqi, 0) / estimates.length)
        : 0

    const highest_aqi = estimates.length > 0 ? Math.max(...estimates.map((item) => item.estimated_aqi)) : 0
    const lowest_aqi = estimates.length > 0 ? Math.min(...estimates.map((item) => item.estimated_aqi)) : 0

    return NextResponse.json({
      zones,
      estimates: Object.fromEntries(estimateMap),
      summary: {
        total_zones: zones.length,
        average_aqi,
        highest_aqi,
        lowest_aqi,
        distribution: {
          good: estimates.filter((item) => item.category === 'good').length,
          moderate: estimates.filter((item) => item.category === 'moderate').length,
          poor: estimates.filter((item) => item.category === 'poor').length,
          severe: estimates.filter((item) => item.category === 'severe').length,
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Dashboard summary error:', error)
    return NextResponse.json({ error: 'Failed to load dashboard summary' }, { status: 500 })
  }
}
