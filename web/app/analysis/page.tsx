'use client'

import { useState, useEffect } from 'react'
import { NavBar } from '@/components/nav-bar'
import { DisclaimerBanner } from '@/components/disclaimer-banner'
import { FooterDisclaimer } from '@/components/footer-disclaimer'
import { ZoneCluster, AQICorrelation } from '@/lib/types'

export default function AnalysisPage() {
  const [correlations, setCorrelations] = useState<AQICorrelation[]>([])
  const [clusters, setClusters] = useState<ZoneCluster[]>([])
  const [zoneLookup, setZoneLookup] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        const [correlationRes, clusterRes] = await Promise.all([
          fetch('/api/analysis/correlations', { cache: 'no-store' }),
          fetch('/api/analysis/clusters', { cache: 'no-store' }),
        ])

        const correlationData = await correlationRes.json()
        const clusterData = await clusterRes.json()

        setCorrelations(correlationData.data ?? [])
        setClusters(clusterData.data ?? [])
        setZoneLookup(clusterData.zone_lookup ?? {})
      } catch (error) {
        console.error('Failed to load analysis:', error)
      } finally {
        setIsLoading(false)
      }
    }

    void loadAnalysis()
  }, [])

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading analysis...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <DisclaimerBanner />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Pattern Analysis</h1>
          <p className="text-muted-foreground">
            Explore correlations between environmental factors and AQI patterns from persisted zone data.
          </p>
        </div>

        {/* Correlation Analysis */}
        <section className="mb-12">
          <div className="mb-6 pb-4 border-b border-border/30">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <span className="w-1 h-6 bg-primary rounded-full" />
              Factor Correlations
            </h2>
            <p className="text-sm text-muted-foreground mt-2 ml-4">Exploratory • Non-causal • Simulation-based</p>
          </div>
          <div className="card-elevated rounded-lg p-8">
            <p className="text-sm text-muted-foreground mb-6">
              The following correlations show how environmental factors relate to estimated AQI levels in the current dataset.
            </p>

            <div className="space-y-3 mb-8">
              {correlations.map((correlation, index) => {
                const isPositive = correlation.correlation_coefficient > 0
                const absValue = Math.abs(correlation.correlation_coefficient)

                return (
                  <div key={index} className="bg-background/40 border border-border/30 rounded-lg p-5 hover:border-primary/30 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{correlation.factor}</p>
                        <p className="text-sm text-muted-foreground mt-1">{correlation.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p
                          className={`text-2xl font-bold ${
                            isPositive ? 'text-orange-400' : 'text-green-400'
                          }`}
                        >
                          {correlation.correlation_coefficient > 0 ? '+' : ''}
                          {correlation.correlation_coefficient.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Visual bar */}
                    <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${isPositive ? 'bg-orange-500' : 'bg-green-500'}`}
                        style={{ width: `${absValue * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mb-2">
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <span>💡</span> Interpretation Guide
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Correlation values range from <strong>-1 to +1</strong>. Positive values indicate that as one factor increases, AQI tends to increase. Negative values indicate inverse relationships.
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>⚠️ Important:</strong> These are exploratory correlations and do not imply causation.
              </p>
            </div>
          </div>
        </section>

        {/* Zone Clustering */}
        <section className="mb-12">
          <div className="mb-6 pb-4 border-b border-border/30">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <span className="w-1 h-6 bg-primary rounded-full" />
              Zone Clusters
            </h2>
            <p className="text-sm text-muted-foreground mt-2 ml-4">Exploratory • Non-causal • Simulation-based</p>
          </div>
          <div className="card-elevated rounded-lg p-8">
            <p className="text-sm text-muted-foreground mb-8">
              Zones are grouped based on similarity in estimated AQI levels and land use characteristics.
            </p>

            <div className="grid gap-6">
              {clusters.map((cluster) => (
                <div key={cluster.cluster_id} className="bg-background/30 rounded-lg p-6 border border-border/50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Cluster {cluster.cluster_id}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{cluster.characteristics}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Average AQI</p>
                      <p className="text-2xl font-bold text-foreground">{cluster.average_aqi}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      Dominant Land Use:{' '}
                      <span className="font-semibold capitalize">{cluster.dominant_land_use.replace('_', ' ')}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Member Zones: <span className="font-semibold">{cluster.zones.length} zones</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {cluster.zones.map((zoneId) => (
                      <div
                        key={zoneId}
                        className="px-3 py-1 bg-primary/10 text-primary rounded text-xs font-medium border border-primary/30"
                      >
                        {zoneLookup[zoneId] || `Zone ${zoneId.slice(0, 8)}`}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-background/50 border border-border rounded text-sm text-muted-foreground">
              <p className="mb-2">
                <strong>About Clustering:</strong> Zones are grouped based on similarity in estimated AQI levels and
                land use characteristics.
              </p>
              <p>
                <strong>Limitations:</strong> Clustering results are derived from mock data and simplified similarity
                metrics. Real cluster analysis would require more sophisticated statistical methods.
              </p>
            </div>
          </div>
        </section>

        {/* Methodology */}
        <section className="mb-6 pb-6 border-b border-border/30">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3 mb-6">
            <span className="w-1 h-6 bg-primary rounded-full" />
            Methodology & Limitations
          </h2>
          <div className="bg-background/30 border border-border/30 rounded-lg p-6">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">Correlation Calculation:</strong> Mock correlations are pre-computed based on theoretical relationships between factors and air quality
              </li>
              <li>
                <strong className="text-foreground">Clustering Method:</strong> Zones are grouped using land-use type and estimated AQI ranges
              </li>
              <li>
                <strong className="text-foreground">Data Source:</strong> All analyses use mock/simulated data for educational purposes
              </li>
              <li>
                <strong className="text-foreground">Important Disclaimer:</strong> These results are exploratory and not suitable for policy or regulatory decisions. Validate with real-world data before use.
              </li>
            </ul>
          </div>
        </section>
      </main>
      <FooterDisclaimer />
    </div>
  )
}
