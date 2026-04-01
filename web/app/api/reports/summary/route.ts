import { NextResponse } from 'next/server'
import { getLatestAQIForZones, listZonesByCity } from '@/lib/db/repository'
import { SummaryReport, ReportSimulationSummary } from '@/lib/types'
import { getSupabaseServerClient } from '@/lib/supabase/server'

function parseZoneIds(raw: string | null) {
  if (!raw) return []
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

function withinDateRange(value: string, dateFrom: string | null, dateTo: string | null) {
  const current = new Date(value)
  if (dateFrom && current < new Date(dateFrom)) return false
  if (dateTo && current > new Date(`${dateTo}T23:59:59.999Z`)) return false
  return true
}

function getReportCategory(aqi: number | null) {
  if (aqi === null) return null
  if (aqi <= 50) return 'good' as const
  if (aqi <= 100) return 'satisfactory' as const
  if (aqi <= 200) return 'moderate' as const
  if (aqi <= 300) return 'poor' as const
  return 'severe' as const
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const cityId = url.searchParams.get('cityId') ?? 'default-city'
    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')
    const selectedZoneIds = parseZoneIds(url.searchParams.get('zoneIds'))

    const allZones = await listZonesByCity(cityId)
    const zones = allZones.filter((zone) => {
      if (selectedZoneIds.length > 0 && !selectedZoneIds.includes(zone.id)) return false
      return withinDateRange(zone.created_at, dateFrom, dateTo)
    })

    const estimateMap = await getLatestAQIForZones(zones)
    const estimates = Array.from(estimateMap.values())

    const average_aqi =
      estimates.length > 0
        ? Math.round(estimates.reduce((sum, item) => sum + item.estimated_aqi, 0) / estimates.length)
        : 0

    const highest_aqi = estimates.length > 0 ? Math.max(...estimates.map((item) => item.estimated_aqi)) : 0
    const lowest_aqi = estimates.length > 0 ? Math.min(...estimates.map((item) => item.estimated_aqi)) : 0

    const supabase = getSupabaseServerClient()
    const cityResponse = await supabase
      .from('cities')
      .select('id, name, center_lat, center_lng, zoom')
      .eq('id', cityId)
      .maybeSingle()

    if (cityResponse.error) {
      throw cityResponse.error
    }

    const zoneIds = zones.map((zone) => zone.id)

    let simulationSummary: ReportSimulationSummary = {
      total_runs: 0,
      average_delta: 0,
      best_delta: 0,
      latest_run_at: null,
      latest_scenario_name: null,
    }

    if (zoneIds.length > 0) {
      const [{ data: results, error: resultsError }, { data: scenarios, error: scenariosError }] = await Promise.all([
        supabase
          .from('simulation_results')
          .select('scenario_id, zone_id, delta, created_at')
          .in('zone_id', zoneIds)
          .order('created_at', { ascending: false }),
        supabase
          .from('simulation_scenarios')
          .select('id, zone_id, name, created_at')
          .in('zone_id', zoneIds)
          .order('created_at', { ascending: false }),
      ])

      if (resultsError) throw resultsError
      if (scenariosError) throw scenariosError

      const filteredResults = (results ?? []).filter((row) => withinDateRange(row.created_at, dateFrom, dateTo))
      const scenarioById = new Map((scenarios ?? []).map((scenario) => [scenario.id, scenario]))

      if (filteredResults.length > 0) {
        const latestResult = filteredResults[0]
        simulationSummary = {
          total_runs: filteredResults.length,
          average_delta: Number(
            (filteredResults.reduce((sum, row) => sum + Number(row.delta ?? 0), 0) / filteredResults.length).toFixed(1)
          ),
          best_delta: Math.max(...filteredResults.map((row) => Number(row.delta ?? 0))),
          latest_run_at: latestResult.created_at,
          latest_scenario_name: scenarioById.get(latestResult.scenario_id)?.name ?? null,
        }
      }
    }

    const report: SummaryReport = {
      city: cityResponse.data
        ? {
          id: cityResponse.data.id,
          name: cityResponse.data.name,
          center_lat: Number(cityResponse.data.center_lat),
          center_lng: Number(cityResponse.data.center_lng),
          zoom: Number(cityResponse.data.zoom),
        }
        : {
          id: cityId,
          name: 'Unknown City',
          center_lat: 0,
          center_lng: 0,
          zoom: 12,
        },
      overview: {
        zone_count: zones.length,
        average_aqi,
        highest_aqi,
        lowest_aqi,
      },
      distribution: {
        good: estimates.filter((item) => getReportCategory(item.estimated_aqi) === 'good').length,
        satisfactory: estimates.filter((item) => getReportCategory(item.estimated_aqi) === 'satisfactory').length,
        moderate: estimates.filter((item) => getReportCategory(item.estimated_aqi) === 'moderate').length,
        poor: estimates.filter((item) => getReportCategory(item.estimated_aqi) === 'poor').length,
        severe: estimates.filter((item) => getReportCategory(item.estimated_aqi) === 'severe').length,
      },
      zones: zones.map((zone) => {
        const estimate = estimateMap.get(zone.id)
        return {
          id: zone.id,
          name: zone.name,
          land_use_type: zone.land_use_type,
          traffic_density: zone.traffic_density,
          population_density: zone.population_density,
          road_length: zone.road_length,
          notes: zone.notes,
          created_at: zone.created_at,
          estimated_aqi: estimate?.estimated_aqi ?? null,
          category: getReportCategory(estimate?.estimated_aqi ?? null),
          feature_contributions: estimate?.feature_contributions ?? null,
        }
      }),
      simulation_summary: simulationSummary,
      generated_at: new Date().toISOString(),
      filters: {
        city_id: cityId,
        date_from: dateFrom,
        date_to: dateTo,
        zone_ids: selectedZoneIds,
      },
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Report summary error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate report summary',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
