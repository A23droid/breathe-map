'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { NavBar } from '@/components/nav-bar'
import { DisclaimerBanner } from '@/components/disclaimer-banner'
import { FooterDisclaimer } from '@/components/footer-disclaimer'
import { AQIBadge } from '@/components/aqi-badge'
import { mockZones, generateMockAQIEstimates } from '@/lib/mock-data'
import { AQIEstimate } from '@/lib/types'

export default function DashboardPage() {
  const [estimates, setEstimates] = useState<Map<string, AQIEstimate>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setEstimates(generateMockAQIEstimates())
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading dashboard...</div>
  }

  // Calculate statistics
  const allEstimates = Array.from(estimates.values())
  const averageAQI =
    allEstimates.length > 0
      ? Math.round(allEstimates.reduce((sum, e) => sum + e.estimated_aqi, 0) / allEstimates.length)
      : 0
  const maxAQI = allEstimates.length > 0 ? Math.max(...allEstimates.map((e) => e.estimated_aqi)) : 0
  const minAQI = allEstimates.length > 0 ? Math.min(...allEstimates.map((e) => e.estimated_aqi)) : 0

  const goodCount = allEstimates.filter((e) => e.category === 'good').length
  const moderateCount = allEstimates.filter((e) => e.category === 'moderate').length
  const poorCount = allEstimates.filter((e) => e.category === 'poor').length
  const severeCount = allEstimates.filter((e) => e.category === 'severe').length

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <DisclaimerBanner />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time overview of air quality estimates across all monitored zones.
          </p>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="card-elevated rounded-lg p-6 border-l-4 border-l-aqi-moderate">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Average AQI</p>
                <p className="text-4xl font-bold text-foreground mt-2">{averageAQI}</p>
              </div>
              <span className="text-2xl text-muted-foreground/50">📊</span>
            </div>
            <p className="text-xs text-muted-foreground">Across {mockZones.length} zones</p>
            <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-1">
              <span className="text-amber-400">↑</span>
              <span className="text-xs text-muted-foreground">Stable</span>
            </div>
          </div>

          <div className="card-elevated rounded-lg p-6 border-l-4 border-l-aqi-poor">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Highest AQI</p>
                <p className="text-4xl font-bold text-foreground mt-2">{maxAQI}</p>
              </div>
              <span className="text-2xl text-muted-foreground/50">⚠️</span>
            </div>
            <p className="text-xs text-muted-foreground">Most polluted zone</p>
            <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-1">
              <span className="text-orange-400">↑</span>
              <span className="text-xs text-muted-foreground">+5 pts</span>
            </div>
          </div>

          <div className="card-elevated rounded-lg p-6 border-l-4 border-l-aqi-good">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lowest AQI</p>
                <p className="text-4xl font-bold text-foreground mt-2">{minAQI}</p>
              </div>
              <span className="text-2xl text-muted-foreground/50">✓</span>
            </div>
            <p className="text-xs text-muted-foreground">Cleanest zone</p>
            <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-1">
              <span className="text-green-400">↓</span>
              <span className="text-xs text-muted-foreground">-2 pts</span>
            </div>
          </div>

          <div className="card-elevated rounded-lg p-6 border-l-4 border-l-primary">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Zones</p>
                <p className="text-4xl font-bold text-foreground mt-2">{mockZones.length}</p>
              </div>
              <span className="text-2xl text-muted-foreground/50">📍</span>
            </div>
            <p className="text-xs text-muted-foreground">Active monitoring areas</p>
            <div className="mt-3 pt-3 border-t border-border/30">
              <p className="text-xs text-primary font-semibold">100% Operational</p>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-6">Air Quality Overview</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="card-elevated rounded-lg p-8">
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full" />
                  Distribution
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-aqi-good" />
                      <span className="text-sm">Good</span>
                    </div>
                    <span className="font-semibold">{goodCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-aqi-moderate" />
                      <span className="text-sm">Moderate</span>
                    </div>
                    <span className="font-semibold">{moderateCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-aqi-poor" />
                      <span className="text-sm">Poor</span>
                    </div>
                    <span className="font-semibold">{poorCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-aqi-severe" />
                      <span className="text-sm">Severe</span>
                    </div>
                    <span className="font-semibold">{severeCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Zones */}
            <div className="lg:col-span-2">
              <div className="card-elevated rounded-lg p-8">
                <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full" />
                  Recent Zones
                </h3>
                <div className="space-y-3">
                  {mockZones.slice(0, 5).map((zone) => {
                    const estimate = estimates.get(zone.id)
                    return (
                      <Link
                        key={zone.id}
                        href={`/zones/${zone.id}`}
                        className="flex items-center justify-between p-4 bg-background/40 border border-border/30 rounded-lg hover:border-primary/50 hover:bg-background/60 transition-all duration-200"
                      >
                        <div>
                          <p className="font-semibold text-foreground text-sm">{zone.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {zone.land_use_type.replace('_', ' ')}
                          </p>
                        </div>
                        {estimate && <AQIBadge aqi={estimate.estimated_aqi} showValue={true} />}
                      </Link>
                    )
                  })}
                </div>
                <Link
                  href="/zones"
                  className="mt-6 block text-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  View All Zones
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold text-foreground mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/zones/new"
              className="card-elevated card-hover rounded-lg p-8 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    Create Zone
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">Add a new monitoring area</p>
                </div>
                <span className="text-2xl group-hover:scale-110 transition-transform">+</span>
              </div>
            </Link>

            <Link
              href="/analysis"
              className="card-elevated card-hover rounded-lg p-8 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    View Analysis
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">Explore patterns & clusters</p>
                </div>
                <span className="text-2xl group-hover:scale-110 transition-transform">📊</span>
              </div>
            </Link>

            <Link
              href="/simulation"
              className="card-elevated card-hover rounded-lg p-8 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    Run Simulation
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">Test reduction scenarios</p>
                </div>
                <span className="text-2xl group-hover:scale-110 transition-transform">⚡</span>
              </div>
            </Link>
          </div>
        </div>
      </main>
      <FooterDisclaimer />
    </div>
  )
}
