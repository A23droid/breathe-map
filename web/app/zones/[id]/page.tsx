'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { NavBar } from '@/components/nav-bar'
import { FooterDisclaimer } from '@/components/footer-disclaimer'
import { AQIBadge } from '@/components/aqi-badge'
import { Zone, AQIEstimate } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { useCity } from '@/context/CityContext'
import { Loader } from '@/components/loader'

// ─── FONT CONFIG ────────────────────────────────────────────────────────────
const FONT_IMPORT = 'Google+Sans:wght@300;400;500;600;700'
const FONT_DISPLAY = "'Google Sans', sans-serif"
const FONT_BODY = "'Google Sans', sans-serif"
// ────────────────────────────────────────────────────────────────────────────

// ── Contribution bar ─────────────────────────────────────────────────────────
function ContributionBar({
  icon, label, value, total, weight, color, delay,
}: {
  icon: React.ReactNode; label: string; value: number; total: number;
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
        transform: hovered ? 'translateX(3px)' : 'translateX(0)',
        transition: 'transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease',
        borderColor: hovered ? `${color}30` : 'rgba(255,255,255,0.05)',
        backgroundColor: hovered ? `${color}05` : 'rgba(255,255,255,0.02)',
      }}
      className="rounded-xl border p-4 sm:p-5 cursor-default"
    >
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex-shrink-0 opacity-70">{icon}</span>
          <span
            className="text-sm font-semibold text-zinc-200 truncate"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: `${color}15`,
              color,
              border: `1px solid ${color}20`,
              fontFamily: FONT_DISPLAY,
            }}
          >
            {weight}
          </span>
          <span className="font-bold tabular-nums text-sm" style={{ color, fontFamily: FONT_DISPLAY }}>
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
        <span className="text-[10px] text-zinc-500 tabular-nums">{pct.toFixed(0)}% of total</span>
      </div>
    </div>
  )
}

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({ label, value, unit, icon, color, delay }: {
  label: string; value: number | string; unit?: string;
  icon: React.ReactNode; color: string; delay: number
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease, border-color 0.2s ease',
        boxShadow: hovered ? `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${color}18` : 'none',
        borderColor: hovered ? `${color}22` : 'rgba(255,255,255,0.06)',
        animationDelay: `${delay}ms`,
      }}
      className="rounded-xl border bg-zinc-900/50 p-4 sm:p-5 cursor-default"
    >
      <div className="flex items-start justify-between mb-2">
        <p
          className="text-[10px] sm:text-[11px] font-bold text-zinc-500 uppercase tracking-[0.14em]"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {label}
        </p>
        <span className="opacity-30 leading-none flex-shrink-0">{icon}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <p
          className="text-2xl sm:text-3xl font-bold text-zinc-100 tabular-nums capitalize"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          {value}
        </p>
        {unit && <span className="text-sm text-zinc-500">{unit}</span>}
      </div>
    </div>
  )
}

// ── Section heading with divider ─────────────────────────────────────────────
function SectionHeading({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2
        className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight flex-shrink-0"
        style={{ fontFamily: FONT_DISPLAY }}
      >
        {title}
      </h2>
      <div className="h-px flex-1 bg-gradient-to-r from-zinc-700/50 to-transparent" />
    </div>
  )
}

const AQI_CATEGORIES = [
  { range: '0–50', label: 'Good', desc: 'Minimal impact', color: '#34d399' },
  { range: '51–100', label: 'Satisfactory', desc: 'Minor breathing discomfort', color: '#fbbf24' },
  { range: '101–200', label: 'Moderate', desc: 'Breathing discomfort to sensitive people', color: '#f97316' },
  { range: '201–300', label: 'Poor', desc: 'Breathing discomfort to most people', color: '#ef4444' },
  { range: '301–400', label: 'Severe', desc: 'Respiratory impacts', color: '#a855f7' },
]

const CONTRIBUTIONS: { key: string; icon: React.ReactNode; label: string; weight: string; color: string }[] = [
  {
    key: 'traffic', label: 'Traffic Impact', weight: '40%', color: '#f97316',
    icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="18" cy="17" r="2" /><circle cx="9" cy="17" r="2" />
    </svg>,
  },
  {
    key: 'population', label: 'Population Impact', weight: '20%', color: '#818cf8',
    icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
    </svg>,
  },
  {
    key: 'road_network', label: 'Road Network Impact', weight: '20%', color: '#60a5fa',
    icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M3 3h6v6H3zM15 3h6v6h-6zM15 15h6v6h-6z" strokeLinejoin="round" />
      <path d="M6 9v3h12V9M6 12v3h9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>,
  },
  {
    key: 'land_use', label: 'Land Use Impact', weight: '20%', color: '#34d399',
    icon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="3" y="3" width="8" height="8" rx="1" strokeLinejoin="round" />
      <rect x="13" y="3" width="8" height="8" rx="1" strokeLinejoin="round" />
      <rect x="3" y="13" width="8" height="8" rx="1" strokeLinejoin="round" />
      <rect x="13" y="13" width="8" height="8" rx="1" strokeLinejoin="round" />
    </svg>,
  },
]

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ZoneDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { currentCityId } = useCity()
  const [zone, setZone] = useState<Zone | null>(null)
  const [estimate, setEstimate] = useState<AQIEstimate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const zoneId = params.id as string
    const load = async () => {
      try {
        const res = await fetch(`/api/zones/${zoneId}?cityId=${currentCityId}`, { cache: 'no-store' })
        if (!res.ok) { setIsLoading(false); setMounted(true); return }
        const data = await res.json()
        setZone(data.zone)
        setEstimate(data.estimate)
      } catch (err) {
        console.error('Failed to load zone details:', err)
      } finally {
        setIsLoading(false)
        setMounted(true)
      }
    }
    void load()
  }, [params.id, currentCityId])

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return <Loader variant="page" label="Loading zone details…" />
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!zone || !estimate) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=${FONT_IMPORT}&display=swap'); .body-font { font-family: ${FONT_BODY}; }`}</style>
        <NavBar />
        <main className="body-font flex-1 flex flex-col items-center justify-center gap-5 px-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center">
            <svg width="22" height="22" fill="none" stroke="#52525b" strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-zinc-300 font-semibold mb-1" style={{ fontFamily: FONT_DISPLAY }}>Zone not found</p>
            <p className="text-zinc-600 text-sm">This zone may have been deleted or doesn't exist.</p>
          </div>
          <button
            onClick={() => router.push('/zones')}
            className="px-5 py-2.5 bg-emerald-500 text-zinc-950 font-semibold rounded-xl text-sm hover:bg-emerald-400 transition-colors"
            style={{ boxShadow: '0 0 16px rgba(52,211,153,0.2)', fontFamily: FONT_DISPLAY }}
          >
            Back to Zones
          </button>
        </main>
      </div>
    )
  }

  const aqiColor =
    estimate.estimated_aqi <= 50 ? '#34d399' :
      estimate.estimated_aqi <= 100 ? '#fbbf24' :
        estimate.estimated_aqi <= 200 ? '#f97316' :
          estimate.estimated_aqi <= 300 ? '#ef4444' : '#a855f7'

  // ── Main page ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${FONT_IMPORT}&display=swap');

        :root {
          --font-display: ${FONT_DISPLAY};
          --font-body:    ${FONT_BODY};
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .hero-title { font-family: var(--font-display); }
        .body-font  { font-family: var(--font-body); }
      `}</style>

      <NavBar />

      <main className="body-font flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-14">

        {/* ── Breadcrumb ── */}
        <div
          style={{ animation: mounted ? 'fadeSlideUp 0.4s ease both' : 'none' }}
          className="flex items-center gap-1.5 text-xs text-zinc-600 mb-6 sm:mb-8"
        >
          <Link
            href="/zones"
            className="hover:text-zinc-400 transition-colors duration-150"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            Zones
          </Link>
          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-zinc-500 truncate max-w-[180px] sm:max-w-xs" style={{ fontFamily: FONT_DISPLAY }}>
            {zone.name}
          </span>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

          {/* ── Left: main content ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Hero card */}
            <div
              style={{ animation: mounted ? 'fadeSlideUp 0.45s ease 60ms both' : 'none' }}
              className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5 sm:p-7 overflow-hidden relative"
            >
              {/* Ambient glow */}
              <div
                className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl pointer-events-none"
                style={{ backgroundColor: aqiColor, opacity: 0.05 }}
              />
              {/* AQI-colored left accent */}
              <div
                className="absolute top-0 left-0 w-0.5 h-full rounded-l-2xl"
                style={{ backgroundColor: aqiColor }}
              />

              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <span
                    className="text-[10px] sm:text-[11px] font-bold text-zinc-500 uppercase tracking-[0.15em] block mb-2"
                    style={{ fontFamily: FONT_DISPLAY }}
                  >
                    Zone Detail
                  </span>
                  <h1
                    className="hero-title text-2xl sm:text-3xl md:text-4xl text-zinc-100 tracking-tight mb-2.5 leading-tight font-bold"
                  >
                    {zone.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                    <span className="capitalize">{zone.land_use_type.replace('_', ' ')}</span>
                    <span className="w-px h-3 bg-zinc-700 flex-shrink-0" />
                    <span>Created {formatDate(zone.created_at)}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 pt-0.5">
                  <AQIBadge aqi={estimate.estimated_aqi} showValue={true} />
                </div>
              </div>

              {zone.notes && (
                <div className="rounded-xl border border-indigo-800/25 bg-indigo-950/15 px-4 py-3 mt-4">
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    <span
                      className="text-indigo-400 font-semibold mr-1.5"
                      style={{ fontFamily: FONT_DISPLAY }}
                    >
                      Note:
                    </span>
                    {zone.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Zone characteristics */}
            <div style={{ animation: mounted ? 'fadeSlideUp 0.45s ease 120ms both' : 'none' }}>
              <SectionHeading title="Zone Characteristics" />
              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Traffic Density" value={zone.traffic_density} unit="%"
                  icon={
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="18" cy="17" r="2" /><circle cx="9" cy="17" r="2" />
                    </svg>
                  } color="#f97316" delay={0} />
                <MetricCard label="Population" value={zone.population_density} unit="%"
                  icon={
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                  } color="#818cf8" delay={60} />
                <MetricCard label="Road Network" value={zone.road_length} unit="km"
                  icon={
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M3 3h6v6H3zM15 3h6v6h-6z" strokeLinejoin="round" />
                      <path d="M6 9v3h12V9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  } color="#60a5fa" delay={120} />
                <MetricCard label="Land Use"
                  icon={
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="8" height="8" rx="1" />
                      <rect x="13" y="3" width="8" height="8" rx="1" />
                      <rect x="3" y="13" width="8" height="8" rx="1" />
                      <rect x="13" y="13" width="8" height="8" rx="1" />
                    </svg>
                  } color="#34d399" delay={180}
                  value={zone.land_use_type.replace('_', ' ')}
                />
              </div>
            </div>

            {/* AQI factor breakdown */}
            <div style={{ animation: mounted ? 'fadeSlideUp 0.45s ease 180ms both' : 'none' }}>
              <SectionHeading title="AQI Factor Breakdown" />
              <p className="text-sm text-zinc-500 mb-4 -mt-1 leading-relaxed">
                How each factor contributes to the estimated AQI score.
              </p>

              <div className="space-y-2.5">
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

              <div className="mt-4 rounded-xl border border-zinc-800/40 bg-zinc-900/30 px-4 py-3.5">
                <p
                  className="text-[10px] sm:text-[11px] font-bold text-zinc-500 uppercase tracking-[0.14em] mb-1.5"
                  style={{ fontFamily: FONT_DISPLAY }}
                >
                  Assumptions
                </p>
                <p className="text-xs sm:text-[13px] text-zinc-500 leading-relaxed">{estimate.assumptions}</p>
              </div>
            </div>
          </div>

          {/* ── Right: sidebar ── */}
          <div className="space-y-4 sm:space-y-5">

            {/* AQI score card */}
            <div
              style={{
                animation: mounted ? 'fadeSlideUp 0.45s ease 80ms both' : 'none',
                borderColor: `${aqiColor}22`,
                boxShadow: `0 0 28px ${aqiColor}06`,
              }}
              className="rounded-2xl border bg-zinc-900/60 p-5 sm:p-6 text-center"
            >
              <p
                className="text-[10px] sm:text-[11px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-3"
                style={{ fontFamily: FONT_DISPLAY }}
              >
                Estimated AQI
              </p>
              <div
                className="text-5xl sm:text-6xl font-bold tabular-nums mb-3"
                style={{ color: aqiColor, fontFamily: FONT_DISPLAY }}
              >
                {estimate.estimated_aqi}
              </div>
              <AQIBadge aqi={estimate.estimated_aqi} showValue={false} />
              <div className="mt-4 h-1.5 rounded-full bg-zinc-800/60 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${Math.min((estimate.estimated_aqi / 400) * 100, 100)}%`,
                    backgroundColor: aqiColor,
                  }}
                />
              </div>
              <p className="text-[10px] text-zinc-600 mt-1.5">Scale: 0 – 400+</p>
            </div>

            {/* Quick actions */}
            <div
              style={{ animation: mounted ? 'fadeSlideUp 0.45s ease 140ms both' : 'none' }}
              className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-5"
            >
              <h3
                className="text-sm font-semibold text-zinc-200 mb-3.5"
                style={{ fontFamily: FONT_DISPLAY }}
              >
                Quick Actions
              </h3>
              <div className="space-y-2.5">
                <Link
                  href={`/zones/${zone.id}/edit`}
                  className="flex items-center justify-center w-full py-3 bg-emerald-500 text-zinc-950 font-semibold rounded-xl text-sm hover:bg-emerald-400 transition-colors"
                  style={{ boxShadow: '0 0 14px rgba(52,211,153,0.18)', fontFamily: FONT_DISPLAY }}
                >
                  Edit Zone
                </Link>
                <Link
                  href="/simulation"
                  className="flex items-center justify-center w-full py-3 border border-zinc-700/50 text-zinc-300 font-semibold rounded-xl text-sm hover:border-zinc-600 hover:text-zinc-200 transition-all duration-150"
                  style={{ fontFamily: FONT_DISPLAY }}
                >
                  Simulate Impact
                </Link>
              </div>
            </div>

            {/* AQI categories guide */}
            <div
              style={{ animation: mounted ? 'fadeSlideUp 0.45s ease 200ms both' : 'none' }}
              className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-5"
            >
              <h4
                className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2"
                style={{ fontFamily: FONT_DISPLAY }}
              >
                <svg width="12" height="12" fill="none" stroke="#34d399" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
                </svg>
                AQI Categories
              </h4>
              <div className="space-y-3">
                {AQI_CATEGORIES.map((cat) => {
                  const isActive = estimate.category === cat.label.toLowerCase()
                  return (
                    <div
                      key={cat.label}
                      className="flex items-start gap-3"
                      style={{ opacity: isActive ? 1 : 0.4, transition: 'opacity 0.2s ease' }}
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                        style={{
                          backgroundColor: cat.color,
                          boxShadow: isActive ? `0 0 6px ${cat.color}` : 'none',
                        }}
                      />
                      <div>
                        <p className="text-xs font-semibold text-zinc-300" style={{ fontFamily: FONT_DISPLAY }}>
                          {cat.label}{' '}
                          <span className="text-zinc-600 font-normal">({cat.range})</span>
                        </p>
                        <p className="text-[11px] text-zinc-600 mt-0.5">{cat.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      </main>
      <FooterDisclaimer />
    </div>
  )
}