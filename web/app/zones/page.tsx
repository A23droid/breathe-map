'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { NavBar } from '@/components/nav-bar'
import { DisclaimerBanner } from '@/components/disclaimer-banner'
import { FooterDisclaimer } from '@/components/footer-disclaimer'
import { AQIBadge } from '@/components/aqi-badge'
import { Zone, AQIEstimate } from '@/lib/types'

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [estimates, setEstimates] = useState<Map<string, AQIEstimate>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadZones = async () => {
      try {
        const response = await fetch('/api/zones', { cache: 'no-store' })
        const data = await response.json()
        setZones(data.zones ?? [])
        setEstimates(new Map(Object.entries(data.estimates ?? {}) as [string, AQIEstimate][]))
      } catch (error) {
        console.error('Failed to load zones:', error)
      } finally {
        setIsLoading(false)
      }
    }

    void loadZones()
  }, [])

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading zones...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <DisclaimerBanner />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Air Quality Zones</h1>
            <p className="text-muted-foreground">
              Manage monitoring zones and view estimated AQI values for each area.
            </p>
          </div>
          <Link
            href="/zones/new"
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            + New Zone
          </Link>
        </div>

        {zones.length === 0 ? (
          <div className="card-elevated rounded-lg border-2 border-dashed border-border/50 p-16 text-center">
            <p className="text-lg text-muted-foreground mb-6">No zones created yet</p>
            <Link
              href="/zones/new"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Create First Zone
            </Link>
          </div>
        ) : (
          <div className="card-elevated rounded-lg overflow-hidden border">
            {/* Table Header */}
            <div className="sticky top-0 grid grid-cols-12 gap-4 px-6 py-4 bg-background/50 border-b border-border/50 font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              <div className="col-span-3">Zone Name</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Traffic</div>
              <div className="col-span-2">Population</div>
              <div className="col-span-2">AQI</div>
              <div className="col-span-1 text-right">Action</div>
            </div>

            {/* Table Rows */}
            {zones.map((zone, index) => {
              const estimate = estimates.get(zone.id)
              return (
                <Link key={zone.id} href={`/zones/${zone.id}`}>
                  <div
                    className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-border/30 hover:bg-background/40 transition-colors duration-150 cursor-pointer ${
                      index === zones.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <div className="col-span-3">
                      <p className="font-semibold text-foreground">{zone.name}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground capitalize">
                        {zone.land_use_type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm font-medium text-foreground">{zone.traffic_density}%</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm font-medium text-foreground">{zone.population_density}%</span>
                    </div>
                    <div className="col-span-2">
                      {estimate && <AQIBadge aqi={estimate.estimated_aqi} showValue={true} />}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <span className="text-primary text-lg">→</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
      <FooterDisclaimer />
    </div>
  )
}
