'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { NavBar } from '@/components/nav-bar'
import { DisclaimerBanner } from '@/components/disclaimer-banner'
import { FooterDisclaimer } from '@/components/footer-disclaimer'
import { AQIBadge } from '@/components/aqi-badge'
import { Zone, SimulationResult } from '@/lib/types'
import { formatPercentChange } from '@/lib/utils'

// Styled range slider
function SliderControl({
  label, icon, value, min, max, step, unit, onChange, description, color,
}: {
  label: string; icon: string; value: number; min: number; max: number;
  step: number; unit: string; onChange: (v: number) => void;
  description: string; color: string;
}) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="group">
      <div className="flex justify-between items-center mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <label className="text-sm font-semibold text-zinc-300">{label}</label>
        </div>
        <div
          className="px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {unit === '%' ? `${value}%` : `${(value * 100).toFixed(0)}%`}
        </div>
      </div>

      <div className="relative h-1.5 rounded-full bg-zinc-800 mb-2">
        <div
          className="absolute h-full rounded-full transition-all duration-150"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(unit === '%' ? parseInt(e.target.value) : parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          style={{ WebkitAppearance: 'none' }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-zinc-900 transition-all duration-150 shadow-md pointer-events-none"
          style={{ left: `calc(${pct}% - 7px)`, backgroundColor: color }}
        />
      </div>

      <p className="text-xs text-zinc-600">{description}</p>
    </div>
  )
}

// AQI meter arc
function AQIMeter({ value, label, color, delay = 0 }: { value: number; label: string; color: string; delay?: number }) {
  const [displayed, setDisplayed] = useState(0)
  const max = 200
  const clamp = Math.min(value, max)

  useEffect(() => {
    const t = setTimeout(() => {
      let cur = 0
      const step = Math.max(1, Math.ceil(clamp / 40))
      const iv = setInterval(() => {
        cur += step
        if (cur >= clamp) { setDisplayed(clamp); clearInterval(iv) }
        else setDisplayed(cur)
      }, 18)
      return () => clearInterval(iv)
    }, delay)
    return () => clearTimeout(t)
  }, [clamp, delay])

  const r = 48
  const circumference = Math.PI * r
  const pct = displayed / max
  const dash = pct * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-16 overflow-hidden">
        <svg viewBox="0 0 112 60" className="w-full h-full">
          <path
            d="M 8 56 A 48 48 0 0 1 104 56"
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round"
          />
          <path
            d="M 8 56 A 48 48 0 0 1 104 56"
            fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            style={{ transition: 'stroke-dasharray 0.05s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className="text-2xl font-bold text-zinc-100 tabular-nums leading-none">{displayed.toFixed(2)}</span>
        </div>
      </div>
      <span className="text-[11px] text-zinc-500 uppercase tracking-widest mt-1">{label}</span>
    </div>
  )
}

// Delta pill
function DeltaPill({ delta, pct }: { delta: number; pct: number }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 200); return () => clearTimeout(t) }, [])

  const improved = delta > 0
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.8)',
        transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      }}
      className={`flex flex-col items-center justify-center rounded-2xl border p-5 ${
        improved ? 'border-emerald-700/40 bg-emerald-950/40' : 'border-zinc-700/40 bg-zinc-900/40'
      }`}
    >
      <div className={`text-3xl font-bold tabular-nums ${improved ? 'text-emerald-400' : 'text-zinc-400'}`}>
        {improved ? '−' : '+'}{Math.abs(delta).toFixed(2)}
      </div>
      <div className="text-xs text-zinc-500 mt-1">AQI pts</div>
      <div className={`mt-2 text-sm font-semibold ${improved ? 'text-emerald-400' : 'text-zinc-400'}`}>
        {formatPercentChange(-pct)}
      </div>
    </div>
  )
}

// Self-contained hover card for "How it Works"
function HowItWorksCard({ icon, color, title, desc }: { icon: string; color: string; title: string; desc: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease, border-color 0.2s ease',
        boxShadow: hovered ? `0 12px 32px rgba(0,0,0,0.3), 0 0 0 1px ${color}20` : '0 2px 8px rgba(0,0,0,0.2)',
        borderColor: hovered ? `${color}30` : 'rgba(255,255,255,0.07)',
      }}
      className="rounded-2xl border bg-zinc-900/60 p-6 cursor-default"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4 border"
        style={{ backgroundColor: `${color}12`, borderColor: `${color}20` }}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-zinc-200 mb-2 text-[15px]">{title}</h3>
      <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
    </div>
  )
}

const aqiColor = (v: number) =>
  v <= 50 ? '#34d399' : v <= 100 ? '#fbbf24' : v <= 150 ? '#f97316' : '#f87171'

export default function SimulationPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [vehicleReduction, setVehicleReduction] = useState(0)
  const [greenIncrease, setGreenIncrease] = useState(0)
  const [reroutingFactor, setReroutingFactor] = useState(0)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isZoneLoading, setIsZoneLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

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
        setMounted(true)
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

  // Loading state while zones are being fetched
  if (isZoneLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          <p className="text-zinc-500 text-sm tracking-wide">Loading simulation…</p>
        </div>
      </div>
    )
  }

  // No zones available — backend returned empty list
  if (!selectedZone) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <NavBar />
        <DisclaimerBanner />
        <main className="flex-1 flex flex-col items-center justify-center gap-5 px-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center">
            <svg width="24" height="24" fill="none" stroke="#52525b" strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-200 mb-2">No zones available</h1>
            <p className="text-zinc-500 text-sm max-w-xs">Create a zone first to run scenario simulations.</p>
          </div>
          <Link
            href="/zones/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-zinc-950 font-semibold rounded-xl text-sm hover:bg-emerald-400 transition-colors"
            style={{ boxShadow: '0 0 16px rgba(52,211,153,0.2)' }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
            </svg>
            Create Zone
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        .hero-title { font-family: 'DM Serif Display', serif; }
        .body-font  { font-family: 'DM Sans', sans-serif; }
        .glow-btn {
          box-shadow: 0 0 20px rgba(52,211,153,0.25), 0 4px 12px rgba(0,0,0,0.4);
          transition: box-shadow 0.25s ease, transform 0.2s ease, opacity 0.2s ease;
        }
        .glow-btn:hover:not(:disabled) {
          box-shadow: 0 0 32px rgba(52,211,153,0.45), 0 8px 24px rgba(0,0,0,0.5);
          transform: translateY(-2px);
        }
        .glow-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <NavBar />
      <DisclaimerBanner />

      <main className="body-font flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-10 md:py-14">

        {/* Header */}
        <div
          style={{ animation: mounted ? 'fadeSlideUp 0.5s ease both' : 'none' }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Modelling</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-zinc-600 uppercase tracking-[0.15em]">Live Zone Data</span>
          </div>
          <h1 className="hero-title text-4xl sm:text-5xl text-zinc-100 tracking-tight mb-2">
            Scenario Simulation
          </h1>
          <p className="text-zinc-500 text-[15px] max-w-xl">
            Explore how different pollution reduction interventions could affect estimated AQI in a zone.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── CONTROLS PANEL ── */}
          <div className="lg:col-span-1">
            <div
              style={{ animation: mounted ? 'fadeSlideUp 0.5s ease 80ms both' : 'none' }}
              className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-6 sticky top-4"
            >
              {/* Step badge */}
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-6 h-6 rounded-full bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-[11px] font-bold text-emerald-400">1</div>
                <span className="text-sm font-semibold text-zinc-200">Configure Parameters</span>
              </div>
              <div className="h-px bg-zinc-800/60 mb-6" />

              {/* Zone select — uses backend zones array */}
              <div className="mb-6">
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-2">Zone</label>
                <div className="relative">
                  <select
                    value={selectedZone.id}
                    onChange={(e) => {
                      const zone = zones.find((z) => z.id === e.target.value)
                      if (zone) setSelectedZone(zone)
                    }}
                    className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-zinc-200 text-sm focus:outline-none focus:border-emerald-700/60 focus:ring-1 focus:ring-emerald-700/40 appearance-none transition-colors duration-200"
                  >
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>{zone.name}</option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" fill="none" stroke="#52525b" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-7 mb-7">
                <SliderControl
                  label="Vehicle Reduction" icon="🚗"
                  value={vehicleReduction} min={0} max={100} step={5} unit="%"
                  onChange={setVehicleReduction}
                  description="Reduce vehicle traffic intensity"
                  color="#f97316"
                />
                <SliderControl
                  label="Green Cover Increase" icon="🌿"
                  value={greenIncrease} min={0} max={100} step={5} unit="%"
                  onChange={setGreenIncrease}
                  description="Add trees, parks, or green roofs"
                  color="#34d399"
                />
                <SliderControl
                  label="Traffic Rerouting" icon="🛣️"
                  value={reroutingFactor} min={0} max={1} step={0.1} unit="x"
                  onChange={setReroutingFactor}
                  description="Redirect traffic to alternative routes"
                  color="#60a5fa"
                />
              </div>

              <div className="h-px bg-zinc-800/60 mb-5" />

              <div className="space-y-3">
                <button
                  onClick={handleSimulate}
                  disabled={isLoading}
                  className="glow-btn w-full flex items-center justify-center gap-2.5 py-3.5 bg-emerald-500 text-zinc-950 font-semibold rounded-xl text-[15px]"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-zinc-900/40 border-t-zinc-950 animate-spin" />
                      Simulating…
                    </>
                  ) : (
                    <>
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M5 3l14 9-14 9V3z" strokeLinejoin="round" />
                      </svg>
                      Run Simulation
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  className="w-full py-3 border border-zinc-700/50 text-zinc-400 font-medium rounded-xl text-sm hover:border-zinc-600 hover:text-zinc-300 transition-all duration-200"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* ── RESULTS PANEL ── */}
          <div className="lg:col-span-2">
            {result ? (
              <div
                style={{ animation: 'fadeSlideUp 0.45s ease both' }}
                className="space-y-5"
              >
                {/* Step badge */}
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-[11px] font-bold text-emerald-400">2</div>
                  <span className="text-sm font-semibold text-zinc-200">Review Results</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-zinc-700/50 to-transparent" />
                </div>

                {/* Before / Delta / After */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-5 flex flex-col items-center gap-3">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.15em]">Current</span>
                    <AQIMeter value={result.before_aqi} label="Before" color={aqiColor(result.before_aqi)} delay={0} />
                    <AQIBadge aqi={result.before_aqi} />
                  </div>

                  <div className="flex items-center justify-center">
                    <DeltaPill delta={result.delta} pct={result.delta_percentage} />
                  </div>

                  <div
                    className="rounded-2xl border bg-zinc-900/60 p-5 flex flex-col items-center gap-3"
                    style={{ borderColor: `${aqiColor(result.after_aqi)}30`, boxShadow: `0 0 24px ${aqiColor(result.after_aqi)}10` }}
                  >
                    <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-[0.15em]">Projected</span>
                    <AQIMeter value={result.after_aqi} label="After" color={aqiColor(result.after_aqi)} delay={200} />
                    <AQIBadge aqi={result.after_aqi} />
                  </div>
                </div>

                {/* Impact bar */}
                <div className="rounded-2xl border border-emerald-800/30 bg-emerald-950/20 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-zinc-300">Impact Summary</h3>
                    <span className="text-xs text-zinc-500">Estimated reduction</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-800/60 overflow-hidden mb-4">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(result.delta_percentage, 100)}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Total Reduction</p>
                      <p className="text-2xl font-bold text-emerald-400 tabular-nums">−{result.delta.toFixed(2)} pts</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Percentage Change</p>
                      <p className="text-2xl font-bold text-emerald-400">{formatPercentChange(-result.delta_percentage)}</p>
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
                  <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                    <svg width="14" height="14" fill="none" stroke="#34d399" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01" strokeLinecap="round"/>
                    </svg>
                    How We Got Here
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">{result.explanation}</p>
                </div>

                {/* Assessment */}
                <div className="rounded-2xl border border-indigo-800/30 bg-indigo-950/20 p-5">
                  <h3 className="text-sm font-semibold text-zinc-300 mb-2 flex items-center gap-2">
                    <svg width="14" height="14" fill="none" stroke="#818cf8" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 6v4l3 3" strokeLinecap="round"/>
                    </svg>
                    Assessment
                  </h3>
                  <p className="text-zinc-400 text-sm">{result.recommendation}</p>
                </div>

                {/* Limitations */}
                <div className="rounded-2xl border border-amber-800/30 bg-amber-950/20 p-5">
                  <h4 className="text-sm font-semibold text-amber-300 mb-3 flex items-center gap-2">
                    <svg width="14" height="14" fill="none" stroke="#fbbf24" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round"/>
                    </svg>
                    Important Limitations
                  </h4>
                  <ul className="space-y-2 text-sm text-zinc-500">
                    {[
                      'Projections are based on simplified mock models and should not drive real policy decisions.',
                      'Real pollution reduction involves factors not captured here (weather, seasons, compliance).',
                      'Interventions may have unintended consequences not represented in this linear model.',
                      'Always validate findings with real-world data and expert consultation before implementation.',
                    ].map((item, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span className="text-amber-700 flex-shrink-0 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              /* Empty state */
              <div
                style={{ animation: mounted ? 'fadeSlideUp 0.5s ease 160ms both' : 'none' }}
                className="h-full min-h-[360px] rounded-2xl border border-dashed border-zinc-700/50 bg-zinc-900/30 flex flex-col items-center justify-center text-center px-8 py-16"
              >
                <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center mb-5">
                  <svg width="24" height="24" fill="none" stroke="#34d399" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-zinc-200 font-semibold text-lg mb-2">Configure parameters to begin</p>
                <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
                  Explore how different strategies could reduce estimated AQI in{' '}
                  <span className="text-zinc-300">{selectedZone.name}</span>
                </p>
                <div className="mt-8 flex items-center gap-2 text-xs text-zinc-600">
                  <span className="w-1 h-1 rounded-full bg-zinc-600" />
                  Adjust sliders, then hit Run Simulation
                  <span className="w-1 h-1 rounded-full bg-zinc-600" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <section className="mt-14">
          <div className="flex items-center gap-3 mb-7">
            <h2 className="hero-title text-2xl sm:text-3xl text-zinc-100 tracking-tight">How the Simulation Works</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-zinc-700/50 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <HowItWorksCard
              icon="🚗" color="#f97316"
              title="Vehicle Reduction"
              desc="We assume 40% of AQI is driven by vehicular emissions. Reducing vehicles by X% reduces this component proportionally. Real-world impact depends on enforcement and alternative transport availability."
            />
            <HowItWorksCard
              icon="🌿" color="#34d399"
              title="Green Coverage"
              desc="Vegetation acts as a natural filter and pollutant absorber. Each 1% increase in green cover is estimated to reduce AQI by 0.5 points in this simplified model."
            />
            <HowItWorksCard
              icon="🛣️" color="#60a5fa"
              title="Traffic Rerouting"
              desc="Moving traffic to less sensitive areas can marginally reduce local concentrations in a specific zone, but doesn't eliminate total pollution."
            />
          </div>
        </section>

      </main>
      <FooterDisclaimer />
    </div>
  )
}