import { NextResponse } from 'next/server'
import { getLatestAQIForZones, listZonesByCity } from '@/lib/db/repository'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const cityId = url.searchParams.get('cityId') ?? undefined
    const zones = await listZonesByCity(cityId)
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
          satisfactory: estimates.filter((item) => item.category === 'satisfactory').length,
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
