import { NextResponse } from 'next/server'
import { mockZones, generateMockAQIEstimates, generateMockClusters } from '@/lib/mock-data'

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
    // Generate current estimates for all zones
    const estimates = generateMockAQIEstimates()

    // Generate clusters based on current mock data
    const clusters = generateMockClusters(estimates)

    const response = {
      data: clusters,
      total_zones: mockZones.length,
      total_clusters: clusters.length,
      disclaimer:
        'EXPLORATORY CLUSTERING: Zone groupings are based on mock AQI calculations and land use types. Results are for educational purposes only and do not represent validated environmental clusters.',
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
