import { Zone } from '@/lib/types'

export function getFallbackAQIPrediction(zone: Zone) {
  const traffic = Number.isFinite(zone.traffic_density) ? zone.traffic_density : 0
  const population = Number.isFinite(zone.population_density) ? zone.population_density : 0
  const road = Number.isFinite(zone.road_length) ? zone.road_length : 0

  const landUseBonus: Record<string, number> = {
    industrial: 42,
    commercial: 24,
    mixed: 15,
    residential: 10,
    green_space: -18,
  }

  const estimated = Math.round(
    Math.max(
      5,
      Math.min(
        500,
        18 + traffic * 0.65 + population * 0.28 + Math.min(road * 3.2, 80) + (landUseBonus[zone.land_use_type] ?? 15)
      )
    )
  )

  const category =
    estimated <= 50 ? 'good' :
      estimated <= 100 ? 'satisfactory' :
        estimated <= 200 ? 'moderate' :
          estimated <= 300 ? 'poor' : 'severe'

  return {
    estimated_aqi: estimated,
    category,
    cluster_id: 0,
    feature_contributions: {
      traffic: Number((traffic * 0.42).toFixed(2)),
      population: Number((population * 0.24).toFixed(2)),
      road_network: Number((road * 2.5).toFixed(2)),
      land_use: Number((landUseBonus[zone.land_use_type] ?? 15).toFixed(2)),
    },
    model_version: 'fallback_formula_v1',
  } as const
}

