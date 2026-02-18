'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { NavBar } from '@/components/nav-bar'
import { DisclaimerBanner } from '@/components/disclaimer-banner'
import { FooterDisclaimer } from '@/components/footer-disclaimer'
import { AQIBadge } from '@/components/aqi-badge'
import { AQIEstimate, Zone } from '@/lib/types'

// Mini sparkline bar
function SparkBar({ value, max, color }: { value: number; max: number; color: string }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth((value / max) * 100), 200)
    return () => clearTimeout(t)
  }, [value, max])
  return (
    <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden mt-3">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${width}%`, backgroundColor: color }}
      />
    </div>
  )
}

// Animated counter
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

// Donut chart for category distribution
function DonutChart({ good, moderate, poor, severe, total }: {
  good: number; moderate: number; poor: number; severe: number; total: number
}) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 300); return () => clearTimeout(t) }, [])

  const size = 120
  const cx = size / 2
  const cy = size / 2
  const r = 44
  const circumference = 2 * Math.PI * r

  const segments = [
    { count: good,     color: '#34d399', label: 'Good' },
    { count: moderate, color: '#fbbf24', label: 'Moderate' },
    { count: poor,     color: '#f97316', label: 'Poor' },
    { count: severe,   color: '#f87171', label: 'Severe' },
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
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 flex-shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth="12"
            strokeLinecap="butt"
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={-arc.offset}
            style={{ transition: `stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1) ${i * 0.1}s` }}
          />
        ))}
        <circle cx={cx} cy={cy} r={r - 8} fill="#111113" />
      </svg>
      <div className="space-y-2.5 flex-1">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-zinc-400 text-xs">{s.label}</span>
            </div>
            <span className="font-semibold text-zinc-200 text-xs tabular-nums">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Stat card
function StatCard({
  label, value, sub, color, trend, trendLabel, icon, delay
}: {
  label: string; value: number; sub: string; color: string;
  trend: 'up' | 'down' | 'flat'; trendLabel: string; icon: string; delay: number
}) {
  const [hovered, setHovered] = useState(false)
  const trendColor = trend === 'down' ? '#34d399' : trend === 'up' ? '#f97316' : '#94a3b8'
  const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        animationDelay: `${delay}ms`,
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease',
        boxShadow: hovered ? `0 12px 32px rgba(0,0,0,0.35), 0 0 0 1px ${color}30` : '0 2px 8px rgba(0,0,0,0.2)',
        animation: `fadeSlideUp 0.5s ease ${delay}ms both`,
      }}
      className="relative rounded-2xl p-6 border border-zinc-800/60 bg-zinc-900/70 overflow-hidden cursor-default"
    >
      <div className="absolute top-0 left-0 w-0.5 h-full rounded-l-2xl" style={{ backgroundColor: color }} />
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl transition-opacity duration-300"
        style={{ backgroundColor: color, opacity: hovered ? 0.12 : 0.05 }}
      />
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.15em]">{label}</p>
        <span className="text-xl opacity-40">{icon}</span>
      </div>
      <p className="text-4xl font-bold text-zinc-100 mb-1 tabular-nums">
        <AnimatedNumber target={value} />
      </p>
      <p className="text-xs text-zinc-500 mb-1">{sub}</p>
      <SparkBar value={value} max={200} color={color} />
      <div className="mt-2.5 flex items-center gap-1">
        <span className="text-xs font-semibold" style={{ color: trendColor }}>{trendArrow}</span>
        <span className="text-xs text-zinc-500">{trendLabel}</span>
      </div>
    </div>
  )
}

// Zone row — uses Zone type from backend
function ZoneRow({ zone, estimate }: { zone: Zone; estimate?: AQIEstimate }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href={`/zones/${zone.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: hovered ? 'translateX(4px)' : 'translateX(0)',
        transition: 'transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
        borderColor: hovered ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.05)',
        backgroundColor: hovered ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.02)',
      }}
      className="flex items-center justify-between px-4 py-3.5 rounded-xl border"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{
            backgroundColor:
              estimate?.category === 'good'     ? '#34d399' :
              estimate?.category === 'moderate' ? '#fbbf24' :
              estimate?.category === 'poor'     ? '#f97316' : '#f87171',
            boxShadow: `0 0 6px ${
              estimate?.category === 'good'     ? '#34d399' :
              estimate?.category === 'moderate' ? '#fbbf24' :
              estimate?.category === 'poor'     ? '#f97316' : '#f87171'
            }80`,
          }}
        />
        <div className="min-w-0">
          <p className="font-semibold text-zinc-200 text-sm truncate">{zone.name}</p>
          <p className="text-xs text-zinc-500 capitalize">{zone.land_use_type.replace('_', ' ')}</p>
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

// Quick action card
function ActionCard({ href, title, desc, icon, delay }: {
  href: string; title: string; desc: string; icon: React.ReactNode; delay: number
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        animationDelay: `${delay}ms`,
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease, border-color 0.2s ease',
        boxShadow: hovered ? '0 12px 32px rgba(52,211,153,0.1), 0 4px 12px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.2)',
        borderColor: hovered ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.07)',
        animation: `fadeSlideUp 0.5s ease ${delay}ms both`,
      }}
      className="relative rounded-2xl p-6 border bg-zinc-900/60 overflow-hidden group cursor-pointer"
    >
      <div
        className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full blur-2xl bg-emerald-500 transition-opacity duration-300"
        style={{ opacity: hovered ? 0.08 : 0 }}
      />
      <div
        style={{
          transform: hovered ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)',
          transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center mb-4"
      >
        {icon}
      </div>
      <p
        className="font-semibold text-[15px] mb-1.5 transition-colors duration-200"
        style={{ color: hovered ? '#6ee7b7' : '#f4f4f5' }}
      >
        {title}
      </p>
      <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
    </Link>
  )
}

export default function DashboardPage() {
  const emptySummary = {
    average_aqi: 0,
    highest_aqi: 0,
    lowest_aqi: 0,
    total_zones: 0,
    distribution: { good: 0, moderate: 0, poor: 0, severe: 0 },
  }

  const [zones, setZones] = useState<Zone[]>([])
  const [estimates, setEstimates] = useState<Map<string, AQIEstimate>>(new Map())
  const [summary, setSummary] = useState(emptySummary)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const response = await fetch('/api/dashboard/summary', { cache: 'no-store' })
        const data = await response.json()
        setZones(data.zones ?? [])
        setEstimates(new Map(Object.entries(data.estimates ?? {}) as [string, AQIEstimate][]))
        setSummary(data.summary ?? emptySummary)
      } catch (error) {
        console.error('Failed to load dashboard:', error)
      } finally {
        setIsLoading(false)
        setMounted(true)
      }
    }

    void loadSummary()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          <p className="text-zinc-500 text-sm tracking-wide">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  // Derive from backend summary
  const averageAQI  = summary.average_aqi
  const maxAQI      = summary.highest_aqi
  const minAQI      = summary.lowest_aqi
  const goodCount     = summary.distribution.good
  const moderateCount = summary.distribution.moderate
  const poorCount     = summary.distribution.poor
  const severeCount   = summary.distribution.severe
  const totalZones  = summary.total_zones

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-title { font-family: 'DM Serif Display', serif; }
        .body-font  { font-family: 'DM Sans', sans-serif; }
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
            <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Overview</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-zinc-600 uppercase tracking-[0.15em]">Live Data</span>
          </div>
          <h1 className="hero-title text-4xl sm:text-5xl text-zinc-100 tracking-tight mb-2">
            Dashboard
          </h1>
          <p className="text-zinc-500 text-[15px]">
            Estimated air quality overview across all monitored zones.
          </p>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard
            label="Average AQI" value={averageAQI} sub={`Across ${totalZones} zones`}
            color="#fbbf24" trend="flat" trendLabel="Stable" icon="📊" delay={80}
          />
          <StatCard
            label="Highest AQI" value={maxAQI} sub="Most polluted zone"
            color="#f97316" trend="up" trendLabel="+5 pts" icon="⚠️" delay={160}
          />
          <StatCard
            label="Lowest AQI" value={minAQI} sub="Cleanest zone"
            color="#34d399" trend="down" trendLabel="-2 pts" icon="✓" delay={240}
          />
          <StatCard
            label="Total Zones" value={totalZones} sub="Active monitoring areas"
            color="#818cf8" trend="flat" trendLabel="100% Operational" icon="📍" delay={320}
          />
        </div>

        {/* Air Quality Overview */}
        <div className="mb-10">
          <div
            style={{ animation: mounted ? 'fadeSlideUp 0.5s ease 350ms both' : 'none' }}
            className="flex items-center gap-3 mb-6"
          >
            <h2 className="hero-title text-2xl sm:text-3xl text-zinc-100 tracking-tight">Air Quality Overview</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-zinc-700/50 to-transparent" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Distribution donut */}
            <div
              style={{ animation: mounted ? 'fadeSlideUp 0.5s ease 400ms both' : 'none' }}
              className="rounded-2xl p-6 border border-zinc-800/60 bg-zinc-900/60"
            >
              <h3 className="text-sm font-semibold text-zinc-300 mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Distribution
              </h3>
              <DonutChart
                good={goodCount} moderate={moderateCount}
                poor={poorCount} severe={severeCount}
                total={totalZones}
              />
              <div className="mt-5 pt-4 border-t border-zinc-800/50">
                <p className="text-xs text-zinc-600 text-center">{totalZones} zones total</p>
              </div>
            </div>

            {/* Recent Zones */}
            <div
              style={{ animation: mounted ? 'fadeSlideUp 0.5s ease 460ms both' : 'none' }}
              className="lg:col-span-2 rounded-2xl p-6 border border-zinc-800/60 bg-zinc-900/60"
            >
              <h3 className="text-sm font-semibold text-zinc-300 mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Recent Zones
              </h3>
              <div className="space-y-2">
                {zones.slice(0, 5).map((zone) => {
                  const estimate = estimates.get(zone.id)
                  return <ZoneRow key={zone.id} zone={zone} estimate={estimate} />
                })}
                {zones.length === 0 && (
                  <p className="text-zinc-600 text-sm text-center py-6">No zones available.</p>
                )}
              </div>
              <Link
                href="/zones"
                className="mt-5 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-zinc-950 rounded-xl text-sm font-semibold hover:bg-emerald-400 transition-colors duration-200"
                style={{ boxShadow: '0 0 20px rgba(52,211,153,0.2)' }}
              >
                View All Zones
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div
            style={{ animation: mounted ? 'fadeSlideUp 0.5s ease 500ms both' : 'none' }}
            className="flex items-center gap-3 mb-6"
          >
            <h2 className="hero-title text-2xl sm:text-3xl text-zinc-100 tracking-tight">Quick Actions</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-zinc-700/50 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActionCard
              href="/zones/new"
              title="Create Zone"
              desc="Add a new monitoring area and configure its parameters"
              delay={560}
              icon={
                <svg width="18" height="18" fill="none" stroke="#34d399" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
              }
            />
            <ActionCard
              href="/analysis"
              title="View Analysis"
              desc="Explore correlations, patterns and zone clustering"
              delay={620}
              icon={
                <svg width="18" height="18" fill="none" stroke="#60a5fa" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M3 3v18h18" strokeLinecap="round"/>
                  <path d="M7 16l4-4 4 4 4-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            />
            <ActionCard
              href="/simulation"
              title="Run Simulation"
              desc="Test reduction scenarios and observe estimated outcomes"
              delay={680}
              icon={
                <svg width="18" height="18" fill="none" stroke="#fbbf24" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            />
          </div>
        </div>

      </main>
      <FooterDisclaimer />
    </div>
  )
}