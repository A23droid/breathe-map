'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { NavBar } from '@/components/nav-bar'
import { DisclaimerBanner } from '@/components/disclaimer-banner'
import { FooterDisclaimer } from '@/components/footer-disclaimer'
import { AQIBadge } from '@/components/aqi-badge'
import { Zone, SimulationResult } from '@/lib/types'
import { formatPercentChange } from '@/lib/utils'

export default function SimulationPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [vehicleReduction, setVehicleReduction] = useState(0)
  const [greenIncrease, setGreenIncrease] = useState(0)
  const [reroutingFactor, setReroutingFactor] = useState(0)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isZoneLoading, setIsZoneLoading] = useState(true)

  useEffect(() => {
    const loadZones = async () => {
      try {
        const response = await fetch('/api/zones', { cache: 'no-store' })
        const data = await response.json()
        const loadedZones = (data.zones ?? []) as Zone[]
        setZones(loadedZones)
        if (loadedZones.length > 0) {
          setSelectedZone(loadedZones[0])
        }
      } catch (error) {
        console.error('Failed to load zones for simulation:', error)
      } finally {
        setIsZoneLoading(false)
      }
    }

    void loadZones()
  }, [])

  const handleSimulate = async () => {
    if (!selectedZone) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/simulation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone_id: selectedZone.id,
          scenario_name: `Simulation for ${selectedZone.name}`,
          vehicle_reduction_percentage: vehicleReduction,
          green_cover_increase: greenIncrease,
          traffic_rerouting_factor: reroutingFactor,
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Simulation error:', error)
      alert('Failed to run simulation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setVehicleReduction(0)
    setGreenIncrease(0)
    setReroutingFactor(0)
    setResult(null)
  }

  if (isZoneLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>
  }

  if (!selectedZone) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <DisclaimerBanner />
        <main className="max-w-3xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-3">No zones available</h1>
          <p className="text-muted-foreground mb-6">Create a zone first to run scenario simulations.</p>
          <Link
            href="/zones/new"
            className="inline-block px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold"
          >
            Create Zone
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <DisclaimerBanner />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Scenario Simulation</h1>
          <p className="text-muted-foreground">
            Explore how different pollution reduction interventions could affect estimated AQI in a zone.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="lg:col-span-1">
            <div className="card-elevated rounded-lg p-8 sticky top-4">
              <h2 className="text-lg font-semibold text-foreground mb-1">Step 1: Configure</h2>
              <p className="text-xs text-muted-foreground mb-6 pb-6 border-b border-border/30">Adjust intervention parameters</p>

              {/* Zone Selection */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-foreground mb-3">Select Zone</label>
                <select
                  value={selectedZone.id}
                  onChange={(e) => {
                    const zone = zones.find((z) => z.id === e.target.value)
                    if (zone) setSelectedZone(zone)
                  }}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle Reduction */}
              <div className="mb-8">
                <div className="flex justify-between items-baseline mb-3">
                  <label className="text-sm font-semibold text-foreground">🚗 Vehicle Reduction</label>
                  <span className="text-lg font-bold text-accent">{vehicleReduction}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={vehicleReduction}
                  onChange={(e) => setVehicleReduction(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
                <p className="text-xs text-muted-foreground mt-2">Reduce vehicle traffic intensity</p>
              </div>

              {/* Green Increase */}
              <div className="mb-8">
                <div className="flex justify-between items-baseline mb-3">
                  <label className="text-sm font-semibold text-foreground">🌿 Green Cover Increase</label>
                  <span className="text-lg font-bold text-accent">{greenIncrease}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={greenIncrease}
                  onChange={(e) => setGreenIncrease(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
                <p className="text-xs text-muted-foreground mt-2">Add trees, parks, or green roofs</p>
              </div>

              {/* Traffic Rerouting */}
              <div className="mb-10">
                <div className="flex justify-between items-baseline mb-3">
                  <label className="text-sm font-semibold text-foreground">🛣️ Traffic Rerouting</label>
                  <span className="text-lg font-bold text-accent">{(reroutingFactor * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={reroutingFactor}
                  onChange={(e) => setReroutingFactor(parseFloat(e.target.value))}
                  className="w-full accent-primary"
                />
                <p className="text-xs text-muted-foreground mt-2">Redirect traffic to alternative routes</p>
              </div>

              <div className="space-y-3 pt-4 border-t border-border/30">
                <button
                  onClick={handleSimulate}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20"
                >
                  {isLoading ? '⏳ Simulating...' : '▶️ Run Simulation'}
                </button>
                <button
                  onClick={handleReset}
                  className="w-full px-4 py-2 bg-background/50 text-foreground rounded-lg font-medium hover:bg-background/70 transition-colors border border-border/30"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {result ? (
              <div className="space-y-6">
                {/* Step Counter */}
                <div className="flex items-center gap-4 px-4 py-2 bg-background/50 rounded-lg border border-border/30">
                  <span className="text-2xl">2️⃣</span>
                  <span className="text-sm font-semibold text-foreground">Review Results</span>
                </div>

                {/* Before/After Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card-elevated rounded-lg p-8 border-l-4 border-l-orange-500">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Current AQI</p>
                    <p className="text-5xl font-bold text-foreground mb-4">{result.before_aqi}</p>
                    <AQIBadge aqi={result.before_aqi} className="inline-block" />
                  </div>

                  <div className="card-elevated rounded-lg p-8 border-l-4 border-l-green-500 ring-1 ring-green-500/20">
                    <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-2">Projected AQI</p>
                    <p className="text-5xl font-bold text-accent mb-4">{result.after_aqi}</p>
                    <AQIBadge aqi={result.after_aqi} className="inline-block" />
                  </div>
                </div>

                {/* Delta Highlight */}
                <div className="bg-accent/10 border-2 border-accent/30 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Impact Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Reduction</p>
                      <p className="text-3xl font-bold text-green-400">-{result.delta} pts</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Percentage Change</p>
                      <p className="text-3xl font-bold text-green-400">{formatPercentChange(-result.delta_percentage)}</p>
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                <div className="bg-background/40 border border-border/30 rounded-lg p-6">
                  <h3 className="font-semibold text-foreground mb-3">How We Got Here</h3>
                  <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">{result.explanation}</p>
                </div>

                {/* Assessment */}
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-6">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <span>💭</span> Assessment
                  </h3>
                  <p className="text-foreground text-sm">{result.recommendation}</p>
                </div>

                {/* Important Notes Callout */}
                <div className="bg-orange-900/20 border border-orange-700/30 rounded-lg p-6">
                  <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <span>⚠️</span> Important Limitations
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• These projections are based on simplified mock models and should not drive real policy decisions</li>
                    <li>• Real pollution reduction involves factors not captured here (weather, seasons, compliance)</li>
                    <li>• Interventions may have unintended consequences not represented in this linear model</li>
                    <li>• Always validate findings with real-world data and expert consultation before implementation</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="card-elevated rounded-lg p-12 text-center border-2 border-dashed border-border/50">
                <p className="text-2xl mb-3">⚡</p>
                <p className="text-foreground text-lg font-semibold mb-2">Configure parameters to begin</p>
                <p className="text-muted-foreground">
                  Explore how different strategies could reduce estimated AQI in {selectedZone.name}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Educational Content */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3 mb-6">
            <span className="w-1 h-6 bg-primary rounded-full" />
            How the Simulation Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-elevated rounded-lg p-6">
              <div className="text-3xl mb-3">🚗</div>
              <p className="font-semibold text-foreground mb-3">Vehicle Reduction</p>
              <p className="text-sm text-muted-foreground">
                We assume 40% of AQI is driven by vehicular emissions. Reducing vehicles by X% reduces this component proportionally. Real-world impact depends on enforcement and alternative transport availability.
              </p>
            </div>
            <div className="card-elevated rounded-lg p-6">
              <div className="text-3xl mb-3">🌿</div>
              <p className="font-semibold text-foreground mb-3">Green Coverage</p>
              <p className="text-sm text-muted-foreground">
                Vegetation acts as a natural filter and pollutant absorber. Each 1% increase in green cover is estimated to reduce AQI by 0.5 points in this simplified model.
              </p>
            </div>
            <div className="card-elevated rounded-lg p-6">
              <div className="text-3xl mb-3">🛣️</div>
              <p className="font-semibold text-foreground mb-3">Traffic Rerouting</p>
              <p className="text-sm text-muted-foreground">
                Moving traffic to less sensitive areas can marginally reduce local concentrations in a specific zone, but doesn't eliminate total pollution.
              </p>
            </div>
          </div>
        </section>
      </main>
      <FooterDisclaimer />
    </div>
  )
}
