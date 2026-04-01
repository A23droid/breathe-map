'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { NavBar } from '@/components/nav-bar'
import { FooterDisclaimer } from '@/components/footer-disclaimer'
import { AQIBadge } from '@/components/aqi-badge'
import { Loader } from '@/components/loader'
import { AQIEstimate, Zone } from '@/lib/types'
import type { ZoneFeature } from '@/components/zone-map'
import { aqiColor } from '@/components/zone-map'
import { useCity } from '@/context/CityContext'
import { BarChart3, AlertTriangle, CheckCircle, MapPin, Crosshair, X } from 'lucide-react'
import { toastInfo, toastSuccess, toastWarning } from '@/lib/toast'
import { ZoneForm } from '@/components/zone-form'

// ─── FONT CONFIG ────────────────────────────────────────────────────────────
const FONT_IMPORT = 'Google+Sans:wght@300;400;500;600;700'
const FONT_DISPLAY = "'Google Sans', sans-serif"
const FONT_BODY = "'Google Sans', sans-serif"
// ────────────────────────────────────────────────────────────────────────────

const ZoneMap = dynamic(() => import('@/components/zone-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <Loader variant="inline" label="Initialising map…" />
    </div>
  ),
})

// ── SparkBar ─────────────────────────────────────────────────────────────────
function SparkBar({ value, max, color }: { value: number; max: number; color: string }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth((value / max) * 100), 200)
    return () => clearTimeout(t)
  }, [value, max])
  return (
    <div className="h-1 w-full rounded-full bg-white/[0.07] overflow-hidden mt-3">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${width}%`, backgroundColor: color }}
      />
    </div>
  )
}

// ── AnimatedNumber ────────────────────────────────────────────────────────────
function AnimatedNumber({ target }: { target: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let current = 0
    const step = Math.ceil(target / 40)
    const interval = setInterval(() => {
      current += step
      if (current >= target) { setVal(target); clearInterval(interval) }
      else setVal(current)
    }, 20)
    return () => clearInterval(interval)
  }, [target])
  return <>{val}</>
}

// ── DonutChart ────────────────────────────────────────────────────────────────
function DonutChart({ good, satisfactory, moderate, poor, severe, total }: {
  good: number; satisfactory: number; moderate: number; poor: number; severe: number; total: number
}) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 300); return () => clearTimeout(t) }, [])

  const size = 120, cx = size / 2, cy = size / 2, r = 44
  const circumference = 2 * Math.PI * r
  const segments = [
    { count: good, color: '#34d399', label: 'Good' },
    { count: satisfactory, color: '#fbbf24', label: 'Satisfactory' },
    { count: moderate, color: '#f97316', label: 'Moderate' },
    { count: poor, color: '#ef4444', label: 'Poor' },
    { count: severe, color: '#a855f7', label: 'Severe' },
  ]
  let offset = 0
  const arcs = segments.map((s) => {
    const fraction = total > 0 ? s.count / total : 0
    const dash = animated ? fraction * circumference : 0
    const gap = circumference - dash
    const arc = { ...s, dash, gap, offset, fraction }
    offset += fraction * circumference
    return arc
  })

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 flex-shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
        {arcs.map((arc, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={arc.color} strokeWidth="12" strokeLinecap="butt"
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={-arc.offset}
            style={{ transition: `stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1) ${i * 0.1}s` }}
          />
        ))}
        <circle cx={cx} cy={cy} r={r - 8} fill="#111113" />
      </svg>
      <div className="space-y-2.5 flex-1">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              {/* ↑ CONTRAST FIX: zinc-400 not zinc-500 */}
              <span className="text-zinc-400 text-sm">{s.label}</span>
            </div>
            <span className="font-semibold text-zinc-100 text-sm tabular-nums">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, trend, trendLabel, icon, delay }: {
  label: string; value: number; sub: string; color: string;
  trend: 'up' | 'down' | 'flat'; trendLabel: string; icon: React.ReactNode; delay: number
}) {
  const [hovered, setHovered] = useState(false)
  const trendColor = trend === 'down' ? '#34d399' : trend === 'up' ? '#f97316' : '#71717a'
  const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        animationDelay: `${delay}ms`,
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease',
        boxShadow: hovered
          ? `0 12px 32px rgba(0,0,0,0.35), 0 0 0 1px ${color}28`
          : '0 2px 8px rgba(0,0,0,0.2)',
        animation: `fadeSlideUp 0.5s ease ${delay}ms both`,
      }}
      className="relative rounded-2xl p-5 sm:p-6 border border-zinc-800/60 bg-zinc-900/70 overflow-hidden cursor-default"
    >
      <div className="absolute top-0 left-0 w-0.5 h-full rounded-l-2xl" style={{ backgroundColor: color }} />
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl transition-opacity duration-300"
        style={{ backgroundColor: color, opacity: hovered ? 0.12 : 0.05 }}
      />
      <div className="flex items-start justify-between mb-3">
        {/* CONTRAST FIX: zinc-400 label, not zinc-500 */}
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-[0.12em]" style={{ fontFamily: FONT_DISPLAY }}>
          {label}
        </p>
        <span className="opacity-50">{icon}</span>
      </div>
      {/* HIERARCHY: large, bold number — immediately readable */}
      <p className="text-3xl sm:text-4xl font-bold text-zinc-50 mb-1 tabular-nums" style={{ fontFamily: FONT_DISPLAY }}>
        <AnimatedNumber target={value} />
      </p>
      {/* CONTRAST FIX: zinc-400 sub-label */}
      <p className="text-sm text-zinc-400 mb-1">{sub}</p>
      <SparkBar value={value} max={200} color={color} />
      <div className="mt-2.5 flex items-center gap-1">
        <span className="text-sm font-semibold" style={{ color: trendColor }}>{trendArrow}</span>
        <span className="text-sm text-zinc-400">{trendLabel}</span>
      </div>
    </div>
  )
}

// ── ZoneRow ───────────────────────────────────────────────────────────────────
function ZoneRow({ zone, estimate }: { zone: Zone; estimate?: AQIEstimate }) {
  const [hovered, setHovered] = useState(false)
  const dotColor =
    estimate?.category === 'good' ? '#34d399' :
      estimate?.category === 'satisfactory' ? '#fbbf24' :
        estimate?.category === 'moderate' ? '#f97316' :
          estimate?.category === 'poor' ? '#ef4444' : '#a855f7'

  return (
    <Link
      href={`/zones/${zone.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: hovered ? 'translateX(3px)' : 'translateX(0)',
        transition: 'transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
        borderColor: hovered ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.05)',
        backgroundColor: hovered ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.02)',
      }}
      className="flex items-center justify-between px-4 py-3.5 rounded-xl border"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: dotColor, boxShadow: `0 0 6px ${dotColor}80` }}
        />
        <div className="min-w-0">
          {/* CONTRAST: zinc-100 for names */}
          <p className="font-semibold text-zinc-100 text-sm truncate" style={{ fontFamily: FONT_DISPLAY }}>
            {zone.name}
          </p>
          <p className="text-xs text-zinc-400 capitalize mt-0.5">{zone.land_use_type.replace('_', ' ')}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {estimate && <AQIBadge aqi={estimate.estimated_aqi} showValue={true} />}
        <svg
          width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          style={{ color: hovered ? '#34d399' : '#52525b', transition: 'color 0.2s ease' }}
        >
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Link>
  )
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({ title, delay }: { title: string; delay: number }) {
  return (
    <div
      style={{ animation: `fadeSlideUp 0.5s ease ${delay}ms both` }}
      className="flex items-center gap-3 mb-5 sm:mb-6"
    >
      <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight flex-shrink-0" style={{ fontFamily: FONT_DISPLAY }}>
        {title}
      </h2>
      <div className="h-px flex-1 bg-gradient-to-r from-zinc-700/50 to-transparent" />
    </div>
  )
}

// ── Page constants ────────────────────────────────────────────────────────────
const EMPTY_SUMMARY = {
  average_aqi: 0, highest_aqi: 0, lowest_aqi: 0, total_zones: 0,
  distribution: { good: 0, satisfactory: 0, moderate: 0, poor: 0, severe: 0 },
}

export default function DashboardPage() {
  const { currentCityId } = useCity()
  const [zones, setZones] = useState<Zone[]>([])
  const [estimates, setEstimates] = useState<Map<string, AQIEstimate>>(new Map())
  const [summary, setSummary] = useState(EMPTY_SUMMARY)
  const [mapZones, setMapZones] = useState<ZoneFeature[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [isPlacingZone, setIsPlacingZone] = useState(false)
  const [placedGeometry, setPlacedGeometry] = useState<GeoJSON.Polygon | null>(null)
  const [showZoneModal, setShowZoneModal] = useState(false)

  const handleStartPlacement = useCallback(() => {
    setIsPlacingZone(true)
    toastInfo('Click on the map to place a zone')
  }, [])

  const handleZonePlaced = useCallback((_lat: number, _lng: number, geometry: GeoJSON.Polygon) => {
    setPlacedGeometry(geometry)
    setShowZoneModal(true)
    setIsPlacingZone(false)
  }, [])

  const handlePlacementCancelled = useCallback(() => {
    setIsPlacingZone(false)
    setPlacedGeometry(null)
    setShowZoneModal(false)
    toastWarning('Zone placement cancelled')
  }, [])

  const handleZoneSaved = useCallback(async (formData: Omit<Zone, 'id' | 'created_at'> | Zone) => {
    if (!placedGeometry) return
    try {
      const createRes = await fetch('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, cityId: currentCityId, geometry: placedGeometry }),
      })
      if (!createRes.ok) throw new Error('Failed to create zone')
      const createData = await createRes.json()
      const createdZone = createData.zone as Zone

      const estimateRes = await fetch('/api/aqi/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone_id: createdZone.id, cityId: currentCityId }),
      })
      if (!estimateRes.ok) throw new Error('Failed to estimate AQI')
      const estimate = (await estimateRes.json()) as AQIEstimate

      const newZone: ZoneFeature = {
        id: createdZone.id, name: createdZone.name,
        landUseType: createdZone.land_use_type,
        trafficDensity: createdZone.traffic_density,
        populationDensity: createdZone.population_density,
        roadLength: createdZone.road_length,
        notes: createdZone.notes ?? '',
        estimatedAQI: estimate.estimated_aqi,
        geometry: (createdZone.geometry as GeoJSON.Geometry) ?? placedGeometry,
      }
      setMapZones((prev) => [...prev, newZone])
      setZones((prev) => [createdZone, ...prev])
      setEstimates((prev) => { const next = new Map(prev); next.set(createdZone.id, estimate); return next })
      setShowZoneModal(false)
      setPlacedGeometry(null)
      toastSuccess(`Zone "${formData.name}" placed successfully`)
    } catch (err) {
      console.error('Failed to save placed zone:', err)
      toastWarning('Failed to save zone placement')
    }
  }, [placedGeometry, currentCityId])

  useEffect(() => {
    const load = async () => {
      try {
        const summaryRes = await fetch(`/api/dashboard/summary?cityId=${currentCityId}`, { cache: 'no-store' })
        const summaryData = await summaryRes.json()
        setZones(summaryData.zones ?? [])
        setEstimates(new Map(Object.entries(summaryData.estimates ?? {}) as [string, AQIEstimate][]))
        setSummary(summaryData.summary ?? EMPTY_SUMMARY)

        const zonesRes = await fetch(`/api/zones?cityId=${currentCityId}`, { cache: 'no-store' })
        const zonesData = await zonesRes.json()
        const ze = new Map(Object.entries(zonesData.estimates ?? {}) as [string, AQIEstimate][])
        const mappedZones: ZoneFeature[] = (zonesData.zones ?? []).map((zone: Zone) => ({
          id: zone.id, name: zone.name,
          landUseType: zone.land_use_type, trafficDensity: zone.traffic_density,
          populationDensity: zone.population_density, roadLength: zone.road_length,
          notes: zone.notes ?? '',
          estimatedAQI: ze.get(zone.id)?.estimated_aqi ?? 0,
          geometry: ((zone.geometry as GeoJSON.Geometry | null) ?? null) as GeoJSON.Geometry,
        }))
        setMapZones(mappedZones)
      } catch (err) {
        console.error('Failed to load dashboard summary:', err)
      } finally {
        setIsLoading(false)
        setMounted(true)
      }
    }
    void load()
  }, [currentCityId])

  if (isLoading) {
    return <Loader variant="page" label="Loading dashboard…" />
  }

  const { average_aqi, highest_aqi, lowest_aqi, total_zones, distribution } = summary

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${FONT_IMPORT}&display=swap');
        :root { --font-display: ${FONT_DISPLAY}; --font-body: ${FONT_BODY}; }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-title { font-family: var(--font-display); }
        .body-font  { font-family: var(--font-body); }
      `}</style>

      <NavBar />

      <main className="body-font flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-14">

        {/* ── Header ── */}
        <div
          style={{ animation: mounted ? 'fadeSlideUp 0.5s ease both' : 'none' }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8 sm:mb-10"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {/* CONTRAST: zinc-400 not zinc-600 */}
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-[0.15em]" style={{ fontFamily: FONT_DISPLAY }}>
                Live Data
              </span>
            </div>
            {/* HIERARCHY: large h1, strong contrast */}
            <h1 className="hero-title text-3xl sm:text-4xl md:text-5xl text-zinc-50 font-bold tracking-tight mb-2">
              Dashboard
            </h1>
            {/* CONTRAST FIX: zinc-400 */}
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-md">
              Air quality overview across all monitored zones.
            </p>
          </div>

          {/*
            PRIMARY CTA in the header — gives it maximum visibility.
            Not buried in a card at the bottom.
          */}
          <Link
            href="/zones/new"
            className="inline-flex items-center justify-center px-5 py-3 bg-emerald-500 text-zinc-950 font-bold rounded-xl text-sm flex-shrink-0 hover:bg-emerald-400 transition-colors"
            style={{
              boxShadow: '0 0 20px rgba(52,211,153,0.28), 0 4px 12px rgba(0,0,0,0.3)',
              fontFamily: FONT_DISPLAY,
            }}
          >
            Create Zone
          </Link>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
          <StatCard label="Average AQI" value={average_aqi} sub={`Across ${total_zones} zones`} color="#fbbf24" trend="flat" trendLabel="Stable" icon={<BarChart3 size={18} color="#fbbf24" />} delay={80} />
          <StatCard label="Highest AQI" value={highest_aqi} sub="Most polluted zone" color="#f97316" trend="up" trendLabel="+5 pts" icon={<AlertTriangle size={18} color="#f97316" />} delay={160} />
          <StatCard label="Lowest AQI" value={lowest_aqi} sub="Cleanest zone" color="#34d399" trend="down" trendLabel="-2 pts" icon={<CheckCircle size={18} color="#34d399" />} delay={240} />
          <StatCard label="Total Zones" value={total_zones} sub="Active monitoring areas" color="#818cf8" trend="flat" trendLabel="100% Operational" icon={<MapPin size={18} color="#818cf8" />} delay={320} />
        </div>

        {/* ── Zone Map ── */}
        <div className="mb-8 sm:mb-10">
          <div
            style={{ animation: mounted ? 'fadeSlideUp 0.5s ease 340ms both' : 'none' }}
            className="flex items-center gap-3 mb-4 sm:mb-5"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight flex-shrink-0" style={{ fontFamily: FONT_DISPLAY }}>
              Zone Map
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-zinc-700/50 to-transparent" />
            <div className="flex items-center gap-2 flex-shrink-0">
              {isPlacingZone ? (
                <button
                  onClick={handlePlacementCancelled}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-semibold hover:bg-red-500/20 transition-colors"
                  style={{ fontFamily: FONT_DISPLAY }}
                >
                  <X size={11} /> Cancel
                </button>
              ) : (
                <button
                  onClick={handleStartPlacement}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
                  style={{ fontFamily: FONT_DISPLAY }}
                >
                  <Crosshair size={11} /> Add Zone
                </button>
              )}
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {isPlacingZone ? 'Click map to place' : 'Click zone for details'}
              </div>
            </div>
          </div>

          <div
            style={{
              height: 'clamp(320px, 50vh, 560px)',
              animation: mounted ? 'fadeSlideUp 0.5s ease 380ms both' : 'none',
            }}
            className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 overflow-hidden"
          >
            {mapZones.length > 0 ? (
              <ZoneMap zones={mapZones} isPlacingZone={isPlacingZone} onZonePlaced={handleZonePlaced} onPlacementCancelled={handlePlacementCancelled} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 px-4">
                <div className="w-11 h-11 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center">
                  <svg width="18" height="18" fill="none" stroke="#52525b" strokeWidth="1.8" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-zinc-300 text-sm font-semibold mb-1" style={{ fontFamily: FONT_DISPLAY }}>No zones to display</p>
                  <p className="text-zinc-500 text-sm">Create a zone to see it on the map.</p>
                </div>
                <Link
                  href="/zones/new"
                  className="inline-flex items-center justify-center px-4 py-2.5 bg-emerald-500 text-zinc-950 font-semibold rounded-xl text-sm hover:bg-emerald-400 transition-colors"
                  style={{ boxShadow: '0 0 12px rgba(52,211,153,0.2)', fontFamily: FONT_DISPLAY }}
                >
                  Add First Zone
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Air Quality Overview ── */}
        <div className="mb-8 sm:mb-10">
          <SectionHeading title="Air Quality Overview" delay={420} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">

            {/* Donut */}
            <div
              style={{ animation: mounted ? 'fadeSlideUp 0.5s ease 460ms both' : 'none' }}
              className="rounded-2xl p-5 sm:p-6 border border-zinc-800/60 bg-zinc-900/60"
            >
              <h3 className="text-sm font-semibold text-zinc-300 mb-5" style={{ fontFamily: FONT_DISPLAY }}>
                Distribution
              </h3>
              <DonutChart good={distribution.good} satisfactory={distribution.satisfactory} moderate={distribution.moderate} poor={distribution.poor} severe={distribution.severe} total={total_zones} />
              <div className="mt-5 pt-4 border-t border-zinc-800/50">
                <p className="text-sm text-zinc-400 text-center">{total_zones} zones total</p>
              </div>
            </div>

            {/* Recent zones — takes 2 cols, more visual weight */}
            <div
              style={{ animation: mounted ? 'fadeSlideUp 0.5s ease 500ms both' : 'none' }}
              className="lg:col-span-2 rounded-2xl border border-zinc-800/60 bg-zinc-900/60 overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-zinc-800/50">
                <h3 className="text-sm font-semibold text-zinc-300" style={{ fontFamily: FONT_DISPLAY }}>
                  Recent Zones
                </h3>
                {/*
                  "View All" promoted to be a real link in the header, not a full-width button below.
                  It feels like a natural action, not a filler.
                */}
                <Link
                  href="/zones"
                  className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                  style={{ fontFamily: FONT_DISPLAY }}
                >
                  View all
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
              <div className="px-4 sm:px-5 py-3 space-y-1.5">
                {zones.slice(0, 5).map((zone) => (
                  <ZoneRow key={zone.id} zone={zone} estimate={estimates.get(zone.id)} />
                ))}
                {zones.length === 0 && (
                  <div className="py-10 text-center">
                    <p className="text-zinc-400 text-sm mb-1">No zones yet</p>
                    <p className="text-zinc-500 text-xs">Create your first zone to start monitoring.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        {/*
          DIFFERENTIATED card layout:
          - Primary card ("Create Zone") is visually elevated: full green fill, large, left-weighted
          - Secondary cards are muted: dark, outlined, smaller
          Breaking the uniform 3-column grid into an intentional asymmetric layout.
        */}
        <div>
          <SectionHeading title="Quick Actions" delay={540} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">

            {/* Primary action — Create Zone */}
            <Link
              href="/zones/new"
              style={{ animation: mounted ? 'fadeSlideUp 0.5s ease 600ms both' : 'none' }}
              className="group relative sm:col-span-1 rounded-2xl overflow-hidden cursor-pointer"
            >
              {/* Solid emerald background makes this unmistakably primary */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
                  opacity: 0.12,
                }}
              />
              <div
                className="relative h-full flex flex-col p-6 border rounded-2xl transition-all duration-200 group-hover:border-emerald-600/60"
                style={{ borderColor: 'rgba(52,211,153,0.3)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-5 group-hover:bg-emerald-500/30 transition-colors"
                >
                  <svg width="18" height="18" fill="none" stroke="#34d399" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </div>
                {/* HIERARCHY: large, bright label */}
                <p className="font-bold text-base text-zinc-50 mb-1.5 group-hover:text-white transition-colors" style={{ fontFamily: FONT_DISPLAY }}>
                  Create Zone
                </p>
                <p className="text-sm text-zinc-400 leading-relaxed flex-1">
                  Add a new monitoring area and configure its parameters.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-emerald-400 text-sm font-semibold" style={{ fontFamily: FONT_DISPLAY }}>
                  Get started
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Secondary action — Analysis */}
            <Link
              href="/analysis"
              style={{ animation: mounted ? 'fadeSlideUp 0.5s ease 620ms both' : 'none' }}
              className="group relative rounded-2xl overflow-hidden cursor-pointer"
            >
              <div
                className="h-full flex flex-col p-5 sm:p-6 border border-zinc-800/60 bg-zinc-900/60 rounded-2xl transition-all duration-200 group-hover:border-zinc-700/60 group-hover:bg-zinc-900/80"
              >
                <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center mb-4 group-hover:border-zinc-600/60 transition-colors">
                  <svg width="16" height="16" fill="none" stroke="#60a5fa" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path d="M3 3v18h18" strokeLinecap="round" />
                    <path d="M7 16l4-4 4 4 4-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="font-semibold text-sm text-zinc-200 mb-1 group-hover:text-zinc-100 transition-colors" style={{ fontFamily: FONT_DISPLAY }}>
                  View Analysis
                </p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Explore correlations, patterns and zone clustering.
                </p>
              </div>
            </Link>

            {/* Secondary action — Simulation */}
            <Link
              href="/simulation"
              style={{ animation: mounted ? 'fadeSlideUp 0.5s ease 640ms both' : 'none' }}
              className="group relative rounded-2xl overflow-hidden cursor-pointer"
            >
              <div
                className="h-full flex flex-col p-5 sm:p-6 border border-zinc-800/60 bg-zinc-900/60 rounded-2xl transition-all duration-200 group-hover:border-zinc-700/60 group-hover:bg-zinc-900/80"
              >
                <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center mb-4 group-hover:border-zinc-600/60 transition-colors">
                  <svg width="16" height="16" fill="none" stroke="#fbbf24" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="font-semibold text-sm text-zinc-200 mb-1 group-hover:text-zinc-100 transition-colors" style={{ fontFamily: FONT_DISPLAY }}>
                  Run Simulation
                </p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Test reduction scenarios and observe estimated outcomes.
                </p>
              </div>
            </Link>

          </div>
        </div>

      </main>

      <FooterDisclaimer />

      {/* ── Zone Placement Modal ── */}
      {showZoneModal && placedGeometry && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handlePlacementCancelled} />
          <div
            className="relative z-10 w-full max-w-lg rounded-2xl border border-zinc-800/60 bg-zinc-950/95 backdrop-blur-xl shadow-2xl overflow-hidden"
            style={{ animation: 'fadeSlideUp 0.3s ease both', maxHeight: '88vh' }}
          >
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-800/60">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-zinc-100" style={{ fontFamily: FONT_DISPLAY }}>
                  Place New Zone
                </h3>
                <p className="text-sm text-zinc-400 mt-0.5">Configure your new monitoring area</p>
              </div>
              <button
                onClick={handlePlacementCancelled}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
            <div className="px-5 sm:px-6 py-5 overflow-y-auto" style={{ maxHeight: 'calc(88vh - 68px)' }}>
              <ZoneForm onSubmit={handleZoneSaved} onCancel={handlePlacementCancelled} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}