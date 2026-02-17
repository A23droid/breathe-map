'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { NavBar } from '@/components/nav-bar'
import { DisclaimerBanner } from '@/components/disclaimer-banner'
import { FooterDisclaimer } from '@/components/footer-disclaimer'
import { AQIBadge } from '@/components/aqi-badge'
import { Zone, AQIEstimate } from '@/lib/types'
import { formatDate } from '@/lib/utils'

// Animated contribution bar
function ContributionBar({
  icon, label, value, total, weight, color, delay,
}: {
  icon: string; label: string; value: number; total: number;
  weight: string; color: string; delay: number
}) {
  const [width, setWidth] = useState(0)
  const [hovered, setHovered] = useState(false)
  const pct = total > 0 ? (value / total) * 100 : 0

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 300 + delay)
    return () => clearTimeout(t)
  }, [pct, delay])

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: hovered ? 'translateX(4px)' : 'translateX(0)',
        transition: 'transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease',
        borderColor: hovered ? `${color}30` : 'rgba(255,255,255,0.05)',
        backgroundColor: hovered ? `${color}05` : 'rgba(255,255,255,0.02)',
      }}
      className="rounded-xl border p-5 cursor-default"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-semibold text-zinc-300">{label}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}20` }}
          >
            {weight}
          </span>
          <span className="font-bold tabular-nums text-sm" style={{ color }}>
            {value} pts
          </span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-800/60 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-zinc-600">0</span>
        <span className="text-[10px] text-zinc-600 tabular-nums">{pct.toFixed(0)}% of total</span>
      </div>
    </div>
  )
}

// Metric card
function MetricCard({ label, value, unit, icon, color, delay }: {
  label: string; value: number | string; unit?: string;
  icon: string; color: string; delay: number
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease, border-color 0.2s ease',
        boxShadow: hovered ? `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${color}20` : 'none',
        borderColor: hovered ? `${color}25` : 'rgba(255,255,255,0.06)',
        animationDelay: `${delay}ms`,
      }}
      className="rounded-xl border bg-zinc-900/50 p-5 cursor-default"
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.15em]">{label}</p>
        <span className="text-base opacity-50">{icon}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <p className="text-3xl font-bold text-zinc-100 tabular-nums">{value}</p>
        {unit && <span className="text-sm text-zinc-500">{unit}</span>}
      </div>
    </div>
  )
}

const AQI_CATEGORIES = [
  { range: '0–50',    label: 'Good',     desc: 'Satisfactory air quality',   color: '#34d399' },
  { range: '51–100',  label: 'Moderate', desc: 'Acceptable quality',          color: '#fbbf24' },
  { range: '101–150', label: 'Poor',     desc: 'Sensitive groups affected',   color: '#f97316' },
  { range: '>150',    label: 'Severe',   desc: 'General population affected', color: '#f87171' },
]

const CONTRIBUTIONS = [
  { key: 'traffic',      icon: '🚗', label: 'Traffic Impact',      weight: '40%', color: '#f97316' },
  { key: 'population',   icon: '👥', label: 'Population Impact',   weight: '20%', color: '#818cf8' },
  { key: 'road_network', icon: '🛣️', label: 'Road Network Impact', weight: '20%', color: '#60a5fa' },
  { key: 'land_use',     icon: '🏗️', label: 'Land Use Impact',     weight: '20%', color: '#34d399' },
]

export default function ZoneDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [zone, setZone] = useState<Zone | null>(null)
  const [estimate, setEstimate] = useState<AQIEstimate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const zoneId = params.id as string
    const loadZone = async () => {
      try {
        const response = await fetch(`/api/zones/${zoneId}`, { cache: 'no-store' })
        if (!response.ok) {
          setIsLoading(false)
          setMounted(true)
          return
        }
        const data = await response.json()
        setZone(data.zone)
        setEstimate(data.estimate)
      } catch (error) {
        console.error('Failed to load zone details:', error)
      } finally {
        setIsLoading(false)
        setMounted(true)
      }
    }

    void loadZone()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          <p className="text-zinc-500 text-sm tracking-wide">Loading zone details…</p>
        </div>
      </div>
    )
  }

  if (!zone || !estimate) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <NavBar />
        <DisclaimerBanner />
        <main className="flex-1 flex flex-col items-center justify-center gap-5 px-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center">
            <svg width="24" height="24" fill="none" stroke="#52525b" strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-zinc-400 font-medium">Zone not found</p>
          <button
            onClick={() => router.push('/zones')}
            className="px-5 py-2.5 bg-emerald-500 text-zinc-950 font-semibold rounded-xl text-sm hover:bg-emerald-400 transition-colors"
            style={{ boxShadow: '0 0 16px rgba(52,211,153,0.2)' }}
          >
            Back to Zones
          </button>
        </main>
      </div>
    )
  }

  const aqiColor =
    estimate.estimated_aqi <= 50  ? '#34d399' :
    estimate.estimated_aqi <= 100 ? '#fbbf24' :
    estimate.estimated_aqi <= 150 ? '#f97316' : '#f87171'

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-title { font-family: 'DM Serif Display', serif; }
        .body-font  { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <NavBar />
      <DisclaimerBanner />

      <main className="body-font flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 md:py-14">

        {/* Breadcrumb */}
        <div
          style={{ animation: mounted ? 'fadeSlideUp 0.4s ease both' : 'none' }}
          className="flex items-center gap-2 text-xs text-zinc-600 mb-8"
        >
          <Link href="/zones" className="hover:text-zinc-400 transition-colors duration-150">Zones</Link>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-zinc-500 truncate max-w-[200px]">{zone.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── MAIN ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Hero card */}
            <div
              style={{ animation: mounted ? 'fadeSlideUp 0.45s ease 60ms both' : 'none' }}
              className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6 sm:p-8 overflow-hidden relative"
            >
              {/* Glow orb */}
              <div
                className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl pointer-events-none"
                style={{ backgroundColor: aqiColor, opacity: 0.06 }}
              />
              {/* Left accent */}
              <div className="absolute top-0 left-0 w-0.5 h-full rounded-l-2xl" style={{ backgroundColor: aqiColor }} />

              <div className="flex items-start justify-between mb-5 gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.15em]">Zone Detail</span>
                  </div>
                  <h1 className="hero-title text-3xl sm:text-4xl text-zinc-100 tracking-tight mb-2 leading-tight">
                    {zone.name}
                  </h1>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5 capitalize">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                      {zone.land_use_type.replace('_', ' ')}
                    </span>
                    <span className="w-px h-3 bg-zinc-700" />
                    <span>Created {formatDate(zone.created_at)}</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <AQIBadge aqi={estimate.estimated_aqi} showValue={true} />
                </div>
              </div>

              {zone.notes && (
                <div className="rounded-xl border border-indigo-800/30 bg-indigo-950/20 px-4 py-3 mt-4">
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    <span className="text-indigo-400 font-semibold mr-1.5">Note:</span>
                    {zone.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Zone metrics */}
            <div style={{ animation: mounted ? 'fadeSlideUp 0.45s ease 120ms both' : 'none' }}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="hero-title text-xl text-zinc-100 tracking-tight">Zone Characteristics</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-zinc-700/50 to-transparent" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Traffic Density" value={zone.traffic_density}   unit="%"  icon="🚗" color="#f97316" delay={0} />
                <MetricCard label="Population"      value={zone.population_density} unit="%"  icon="👥" color="#818cf8" delay={60} />
                <MetricCard label="Road Network"    value={zone.road_length}        unit="km" icon="🛣️" color="#60a5fa" delay={120} />
                <MetricCard
                  label="Land Use" icon="🏗️" color="#34d399" delay={180}
                  value={zone.land_use_type.replace('_', ' ')}
                />
              </div>
            </div>

            {/* Factor breakdown */}
            <div style={{ animation: mounted ? 'fadeSlideUp 0.45s ease 180ms both' : 'none' }}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="hero-title text-xl text-zinc-100 tracking-tight">AQI Factor Breakdown</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-zinc-700/50 to-transparent" />
              </div>
              <p className="text-sm text-zinc-500 mb-4">How each factor contributes to the estimated AQI score:</p>

              <div className="space-y-3">
                {CONTRIBUTIONS.map((c, i) => (
                  <ContributionBar
                    key={c.key}
                    icon={c.icon} label={c.label} weight={c.weight} color={c.color}
                    value={(estimate.feature_contributions as Record<string, number>)[c.key] ?? 0}
                    total={estimate.estimated_aqi}
                    delay={i * 80}
                  />
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-zinc-800/50 bg-zinc-900/30 px-4 py-3">
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-1">Assumptions</p>
                <p className="text-xs text-zinc-600 leading-relaxed">{estimate.assumptions}</p>
              </div>
            </div>
          </div>

          {/* ── SIDEBAR ── */}
          <div className="space-y-5">

            {/* AQI score card */}
            <div
              style={{
                animation: mounted ? 'fadeSlideUp 0.45s ease 80ms both' : 'none',
                borderColor: `${aqiColor}25`,
                boxShadow: `0 0 32px ${aqiColor}08`,
              }}
              className="rounded-2xl border bg-zinc-900/60 p-6 text-center"
            >
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-3">Estimated AQI</p>
              <div
                className="text-6xl font-bold tabular-nums mb-2"
                style={{ color: aqiColor, fontFamily: "'DM Serif Display', serif" }}
              >
                {estimate.estimated_aqi}
              </div>
              <AQIBadge aqi={estimate.estimated_aqi} showValue={false} />
              <div className="mt-4 h-1.5 rounded-full bg-zinc-800/60 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min((estimate.estimated_aqi / 200) * 100, 100)}%`, backgroundColor: aqiColor }}
                />
              </div>
              <p className="text-[10px] text-zinc-600 mt-1.5">Scale: 0 – 200+</p>
            </div>

            {/* Quick actions */}
            <div
              style={{ animation: mounted ? 'fadeSlideUp 0.45s ease 140ms both' : 'none' }}
              className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-5 space-y-3"
            >
              <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Quick Actions
              </h3>
              <Link
                href={`/zones/${zone.id}/edit`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 text-zinc-950 font-semibold rounded-xl text-sm hover:bg-emerald-400 transition-colors"
                style={{ boxShadow: '0 0 16px rgba(52,211,153,0.2)' }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinejoin="round"/>
                </svg>
                Edit Zone
              </Link>
              <Link
                href="/simulation"
                className="flex items-center justify-center gap-2 w-full py-3 border border-zinc-700/50 text-zinc-300 font-semibold rounded-xl text-sm hover:border-zinc-600 hover:text-zinc-200 transition-all duration-150"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Simulate Impact
              </Link>
            </div>

            {/* AQI guide */}
            <div
              style={{ animation: mounted ? 'fadeSlideUp 0.45s ease 200ms both' : 'none' }}
              className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-5"
            >
              <h4 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                <svg width="13" height="13" fill="none" stroke="#34d399" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01" strokeLinecap="round"/>
                </svg>
                AQI Categories
              </h4>
              <div className="space-y-3">
                {AQI_CATEGORIES.map((cat) => (
                  <div
                    key={cat.label}
                    className="flex items-start gap-3 py-1"
                    style={{
                      opacity: estimate.category === cat.label.toLowerCase() ? 1 : 0.5,
                      transition: 'opacity 0.2s ease',
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                      style={{
                        backgroundColor: cat.color,
                        boxShadow: estimate.category === cat.label.toLowerCase() ? `0 0 6px ${cat.color}` : 'none',
                      }}
                    />
                    <div>
                      <p className="text-xs font-semibold text-zinc-300">
                        {cat.label} <span className="text-zinc-600 font-normal">({cat.range})</span>
                      </p>
                      <p className="text-[11px] text-zinc-600">{cat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
      <FooterDisclaimer />
    </div>
  )
}