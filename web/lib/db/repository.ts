import { AQIEstimate, AQICorrelation, Zone, ZoneCluster } from '@/lib/types'
import {
  calculateMockAQI,
  getAQICategory,
  getFeatureContributions,
} from '@/lib/mock-data'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function listZones(): Promise<Zone[]> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('zones')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Zone[]
}

export async function getZoneById(id: string): Promise<Zone | null> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase.from('zones').select('*').eq('id', id).maybeSingle()

  if (error) throw error
  return (data as Zone | null) ?? null
}

export async function createZone(zone: Omit<Zone, 'id' | 'created_at'>): Promise<Zone> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase.from('zones').insert(zone).select('*').single()

  if (error) throw error
  return data as Zone
}

export async function storeAQIEstimate(zone: Zone): Promise<AQIEstimate> {
  const estimatedAQI = calculateMockAQI(zone)
  const estimate: AQIEstimate = {
    zone_id: zone.id,
    estimated_aqi: estimatedAQI,
    category: getAQICategory(estimatedAQI),
    feature_contributions: getFeatureContributions(zone),
    assumptions:
      'AQI estimate from weighted deterministic model: traffic (40%), population (20%), road network (20%), land use (20%).',
    timestamp: new Date().toISOString(),
  }

  const supabase = getSupabaseServerClient()
  const { error } = await supabase.from('aqi_estimates').insert({
    zone_id: estimate.zone_id,
    estimated_aqi: estimate.estimated_aqi,
    category: estimate.category,
    feature_contributions: estimate.feature_contributions,
    assumptions: estimate.assumptions,
  })

  if (error) throw error
  return estimate
}

export async function getLatestAQIForZone(zone: Zone): Promise<AQIEstimate> {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('aqi_estimates')
    .select('*')
    .eq('zone_id', zone.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error

  if (!data) {
    return storeAQIEstimate(zone)
  }

  return {
    zone_id: data.zone_id,
    estimated_aqi: data.estimated_aqi,
    category: data.category,
    feature_contributions: data.feature_contributions,
    assumptions: data.assumptions,
    timestamp: data.created_at,
  } as AQIEstimate
}

export async function getLatestAQIForZones(zones: Zone[]): Promise<Map<string, AQIEstimate>> {
  const estimates = new Map<string, AQIEstimate>()

  await Promise.all(
    zones.map(async (zone) => {
      const estimate = await getLatestAQIForZone(zone)
      estimates.set(zone.id, estimate)
    })
  )

  return estimates
}

export function getCorrelationsFromEstimates(zones: Zone[], estimates: Map<string, AQIEstimate>): AQICorrelation[] {
  const withEstimates = zones
    .map((zone) => ({ zone, estimate: estimates.get(zone.id) }))
    .filter((item): item is { zone: Zone; estimate: AQIEstimate } => Boolean(item.estimate))

  if (withEstimates.length === 0) {
    return []
  }

  const rows = withEstimates.map(({ zone, estimate }) => ({
    traffic: zone.traffic_density,
    population: zone.population_density,
    roads: zone.road_length,
    industrial: zone.land_use_type === 'industrial' ? 1 : 0,
    green: zone.land_use_type === 'green_space' ? 1 : 0,
    aqi: estimate.estimated_aqi,
  }))

  const correlation = (x: number[], y: number[]): number => {
    const n = x.length
    if (n < 2) return 0

    const meanX = x.reduce((s, v) => s + v, 0) / n
    const meanY = y.reduce((s, v) => s + v, 0) / n

    const numerator = x.reduce((s, _, i) => s + (x[i] - meanX) * (y[i] - meanY), 0)
    const denomX = Math.sqrt(x.reduce((s, v) => s + Math.pow(v - meanX, 2), 0))
    const denomY = Math.sqrt(y.reduce((s, v) => s + Math.pow(v - meanY, 2), 0))

    if (denomX === 0 || denomY === 0) return 0
    return numerator / (denomX * denomY)
  }

  const aqi = rows.map((r) => r.aqi)

  return [
    {
      factor: 'Traffic Density',
      correlation_coefficient: Number(correlation(rows.map((r) => r.traffic), aqi).toFixed(2)),
      description: 'Correlation between traffic density and estimated AQI',
    },
    {
      factor: 'Population Density',
      correlation_coefficient: Number(correlation(rows.map((r) => r.population), aqi).toFixed(2)),
      description: 'Correlation between population density and estimated AQI',
    },
    {
      factor: 'Road Network Length',
      correlation_coefficient: Number(correlation(rows.map((r) => r.roads), aqi).toFixed(2)),
      description: 'Correlation between road network length and estimated AQI',
    },
    {
      factor: 'Industrial Presence',
      correlation_coefficient: Number(correlation(rows.map((r) => r.industrial), aqi).toFixed(2)),
      description: 'Correlation between industrial land use and estimated AQI',
    },
    {
      factor: 'Green Space Presence',
      correlation_coefficient: Number(correlation(rows.map((r) => r.green), aqi).toFixed(2)),
      description: 'Correlation between green space land use and estimated AQI',
    },
  ]
}

export function getClustersFromEstimates(zones: Zone[], estimates: Map<string, AQIEstimate>): ZoneCluster[] {
  const grouped = new Map<string, Zone[]>()

  for (const zone of zones) {
    const key = zone.land_use_type
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)?.push(zone)
  }

  let clusterId = 1
  const clusters: ZoneCluster[] = []

  for (const [landUse, members] of grouped) {
    if (members.length === 0) continue
    const avgAQI = Math.round(
      members.reduce((sum, zone) => sum + (estimates.get(zone.id)?.estimated_aqi ?? 0), 0) / members.length
    )

    clusters.push({
      cluster_id: clusterId++,
      zones: members.map((m) => m.id),
      average_aqi: avgAQI,
      dominant_land_use: landUse as ZoneCluster['dominant_land_use'],
      characteristics: `Zones primarily categorized as ${landUse.replace('_', ' ')} with similar AQI behavior.`,
    })
  }

  return clusters.sort((a, b) => b.average_aqi - a.average_aqi)
}
