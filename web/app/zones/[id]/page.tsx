'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { NavBar } from '@/components/nav-bar'
import { DisclaimerBanner } from '@/components/disclaimer-banner'
import { FooterDisclaimer } from '@/components/footer-disclaimer'
import { AQIBadge } from '@/components/aqi-badge'
import { Zone, AQIEstimate } from '@/lib/types'
import { formatDate } from '@/lib/utils'

export default function ZoneDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [zone, setZone] = useState<Zone | null>(null)
  const [estimate, setEstimate] = useState<AQIEstimate | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const zoneId = params.id as string
    const loadZone = async () => {
      try {
        const response = await fetch(`/api/zones/${zoneId}`, { cache: 'no-store' })
        if (!response.ok) {
          setIsLoading(false)
          return
        }
        const data = await response.json()
        setZone(data.zone)
        setEstimate(data.estimate)
      } catch (error) {
        console.error('Failed to load zone details:', error)
      } finally {
        setIsLoading(false)
      }
    }

    void loadZone()
  }, [params.id])

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading zone details...</div>
  }

  if (!zone || !estimate) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <DisclaimerBanner />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Zone not found</p>
            <button
              onClick={() => router.push('/zones')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Back to Zones
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <DisclaimerBanner />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push('/zones')}
          className="mb-6 text-primary hover:text-primary/80 font-medium"
        >
          ← Back to Zones
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="card-elevated rounded-lg p-8 border-l-4 border-l-primary">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-3">{zone.name}</h1>
                  <p className="text-sm text-muted-foreground capitalize flex items-center gap-2">
                    📍 {zone.land_use_type.replace('_', ' ')} • Created {formatDate(zone.created_at)}
                  </p>
                </div>
                <AQIBadge aqi={estimate.estimated_aqi} />
              </div>

              {zone.notes && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
                  <p className="text-sm text-foreground italic">💡 {zone.notes}</p>
                </div>
              )}
            </div>

            {/* Zone Metrics */}
            <div className="card-elevated rounded-lg p-8">
              <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full" />
                Zone Characteristics
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background/40 border border-border/30 rounded-lg p-4 hover:border-primary/30 transition-colors">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Traffic Density</p>
                  <p className="text-3xl font-bold text-foreground">{zone.traffic_density}%</p>
                </div>
                <div className="bg-background/40 border border-border/30 rounded-lg p-4 hover:border-primary/30 transition-colors">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Population</p>
                  <p className="text-3xl font-bold text-foreground">{zone.population_density}%</p>
                </div>
                <div className="bg-background/40 border border-border/30 rounded-lg p-4 hover:border-primary/30 transition-colors">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Road Network</p>
                  <p className="text-3xl font-bold text-foreground">{zone.road_length}<span className="text-sm font-normal ml-1">km</span></p>
                </div>
                <div className="bg-background/40 border border-border/30 rounded-lg p-4 hover:border-primary/30 transition-colors">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Land Use</p>
                  <p className="text-lg font-bold text-foreground capitalize">
                    {zone.land_use_type.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Contributions */}
            <div className="card-elevated rounded-lg p-8">
              <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full" />
                AQI Factor Breakdown
              </h2>
              <p className="text-sm text-muted-foreground mb-6">How each factor contributes to the estimated AQI score:</p>
              <div className="space-y-5">
                <div className="bg-background/40 border border-border/30 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-foreground">🚗 Traffic Impact</span>
                    <span className="font-bold text-primary">{estimate.feature_contributions.traffic} pts (40%)</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all duration-500"
                      style={{
                        width: `${(estimate.feature_contributions.traffic / estimate.estimated_aqi) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="bg-background/40 border border-border/30 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-foreground">👥 Population Impact</span>
                    <span className="font-bold text-primary">{estimate.feature_contributions.population} pts (20%)</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all duration-500"
                      style={{
                        width: `${(estimate.feature_contributions.population / estimate.estimated_aqi) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="bg-background/40 border border-border/30 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-foreground">🛣️ Road Network Impact</span>
                    <span className="font-bold text-primary">{estimate.feature_contributions.road_network} pts (20%)</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all duration-500"
                      style={{
                        width: `${(estimate.feature_contributions.road_network / estimate.estimated_aqi) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="bg-background/40 border border-border/30 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-foreground">🏗️ Land Use Impact</span>
                    <span className="font-bold text-primary">{estimate.feature_contributions.land_use} pts (20%)</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all duration-500"
                      style={{
                        width: `${(estimate.feature_contributions.land_use / estimate.estimated_aqi) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border/30">
                <h3 className="font-semibold text-foreground mb-3 text-sm">Assumptions & Notes</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{estimate.assumptions}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card-elevated rounded-lg p-6 space-y-3">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full" />
                Quick Actions
              </h3>
              <button className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                ✏️ Edit Zone
              </button>
              <button className="w-full px-4 py-3 bg-accent/20 text-accent rounded-lg text-sm font-semibold hover:bg-accent/30 transition-all border border-accent/30">
                ⚡ Simulate Impact
              </button>
            </div>

            {/* AQI Guide */}
            <div className="card-elevated rounded-lg p-6">
              <h4 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
                <span>📊</span> AQI Categories
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-aqi-good mt-1 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-foreground">Good (0–50)</p>
                    <p className="text-muted-foreground">Satisfactory air quality</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-aqi-moderate mt-1 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-foreground">Moderate (51–100)</p>
                    <p className="text-muted-foreground">Acceptable quality</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-aqi-poor mt-1 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-foreground">Poor (101–150)</p>
                    <p className="text-muted-foreground">Sensitive groups affected</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-aqi-severe mt-1 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-foreground">Severe (&gt;150)</p>
                    <p className="text-muted-foreground">General population affected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <FooterDisclaimer />
    </div>
  )
}
