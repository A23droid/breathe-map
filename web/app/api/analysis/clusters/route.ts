import { NextResponse } from 'next/server'
import { getClustersFromEstimates, getLatestAQIForZones, listZones } from '@/lib/db/repository'

/**
 * GET /api/analysis/clusters
 * Returns mock zone clusters based on similarity in AQI and characteristics
 * 
 * Response:
 * Array of clusters with zones, average AQI, and characteristics
 * 
 * DISCLAIMER: Clusters are exploratory groupings from mock data only
 */
export async function GET() {
  try {
    const zones = await listZones()
    const estimates = await getLatestAQIForZones(zones)
    const clusters = getClustersFromEstimates(zones, estimates)
    const zoneLookup = Object.fromEntries(zones.map((zone) => [zone.id, zone.name]))

    const response = {
      data: clusters,
      zone_lookup: zoneLookup,
      total_zones: zones.length,
      total_clusters: clusters.length,
      disclaimer:
        'EXPLORATORY CLUSTERING: Zone groupings are based on deterministic AQI estimates and land use. Results are for educational use only.',
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Clustering analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to generate clusters' },
      { status: 500 }
    )
  }
}
