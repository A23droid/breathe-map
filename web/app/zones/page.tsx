'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { NavBar } from '@/components/nav-bar'
import { DisclaimerBanner } from '@/components/disclaimer-banner'
import { FooterDisclaimer } from '@/components/footer-disclaimer'
import { AQIBadge } from '@/components/aqi-badge'
import { Zone, AQIEstimate } from '@/lib/types'

const LAND_USE_ICONS: Record<string, string> = {
  residential: '🏘️',
  commercial:  '🏢',
  industrial:  '🏭',
  green_space: '🌳',
  mixed:       '🏙️',
}

// Single zone row
function ZoneRow({ zone, estimate, index }: { zone: Zone; estimate?: AQIEstimate; index: number }) {
  const [hovered, setHovered] = useState(false)
  const aqiColor =
    !estimate ? '#52525b' :
    estimate.estimated_aqi <= 50  ? '#34d399' :
    estimate.estimated_aqi <= 100 ? '#fbbf24' :
    estimate.estimated_aqi <= 150 ? '#f97316' : '#f87171'

  return (
    <Link
      href={`/zones/${zone.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: hovered ? 'rgba(52,211,153,0.03)' : 'transparent',
        borderBottomColor: 'rgba(39,39,42,0.5)',
        transition: 'background-color 0.15s ease',
        animationDelay: `${index * 40}ms`,
        animation: 'fadeSlideUp 0.4s ease both',
      }}
      className="grid grid-cols-12 gap-4 px-6 py-4 border-b last:border-b-0 group cursor-pointer"
    >
      {/* Name */}
      <div className="col-span-4 flex items-center gap-3 min-w-0">
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-200"
          style={{
            backgroundColor: aqiColor,
            boxShadow: hovered ? `0 0 6px ${aqiColor}` : 'none',
          }}
        />
        <p
          className="font-semibold text-sm truncate transition-colors duration-150"
          style={{ color: hovered ? '#e4e4e7' : '#a1a1aa' }}
        >
          {zone.name}
        </p>
      </div>

      {/* Land use */}
      <div className="col-span-2 flex items-center">
        <span className="text-xs text-zinc-500 capitalize flex items-center gap-1.5">
          <span className="opacity-60">{LAND_USE_ICONS[zone.land_use_type] ?? '📍'}</span>
          {zone.land_use_type.replace('_', ' ')}
        </span>
      </div>

      {/* Traffic */}
      <div className="col-span-2 flex items-center gap-2">
        <div className="h-1 w-12 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
          <div className="h-full rounded-full bg-orange-500/70" style={{ width: `${zone.traffic_density}%` }} />
        </div>
        <span className="text-xs font-medium text-zinc-400 tabular-nums">{zone.traffic_density}%</span>
      </div>

      {/* Population */}
      <div className="col-span-2 flex items-center gap-2">
        <div className="h-1 w-12 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
          <div className="h-full rounded-full bg-indigo-500/70" style={{ width: `${zone.population_density}%` }} />
        </div>
        <span className="text-xs font-medium text-zinc-400 tabular-nums">{zone.population_density}%</span>
      </div>

      {/* AQI */}
      <div className="col-span-1 flex items-center">
        {estimate ? <AQIBadge aqi={estimate.estimated_aqi} showValue={true} /> : (
          <span className="text-xs text-zinc-600">—</span>
        )}
      </div>

      {/* Arrow */}
      <div className="col-span-1 flex items-center justify-end">
        <svg
          width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          style={{ color: hovered ? '#34d399' : '#3f3f46', transition: 'color 0.15s ease, transform 0.2s ease', transform: hovered ? 'translateX(3px)' : 'translateX(0)' }}
        >
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Link>
  )
}

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [estimates, setEstimates] = useState<Map<string, AQIEstimate>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [filter, setFilter] = useState<string>('all')

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
        setMounted(true)
      }
    }

    void loadZones()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          <p className="text-zinc-500 text-sm tracking-wide">Loading zones…</p>
        </div>
      </div>
    )
  }

  const FILTERS = ['all', 'residential', 'commercial', 'industrial', 'green_space', 'mixed']
  const filteredZones = filter === 'all' ? zones : zones.filter((z) => z.land_use_type === filter)

  const goodCount     = Array.from(estimates.values()).filter((e) => e.category === 'good').length
  const moderateCount = Array.from(estimates.values()).filter((e) => e.category === 'moderate').length
  const poorCount     = Array.from(estimates.values()).filter((e) => e.category === 'poor').length
  const severeCount   = Array.from(estimates.values()).filter((e) => e.category === 'severe').length

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-title { font-family: 'DM Serif Display', serif; }
        .body-font  { font-family: 'DM Sans', sans-serif; }
        .glow-btn {
          box-shadow: 0 0 16px rgba(52,211,153,0.2), 0 4px 12px rgba(0,0,0,0.3);
          transition: box-shadow 0.2s ease, transform 0.15s ease;
        }
        .glow-btn:hover {
          box-shadow: 0 0 28px rgba(52,211,153,0.4), 0 6px 20px rgba(0,0,0,0.4);
          transform: translateY(-1px);
        }
        .filter-pill {
          transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }
      `}</style>

      <NavBar />
      <DisclaimerBanner />

      <main className="body-font flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-10 md:py-14">

        {/* Header */}
        <div
          style={{ animation: mounted ? 'fadeSlideUp 0.4s ease both' : 'none' }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8"
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Monitoring</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-zinc-600 uppercase tracking-[0.15em]">{zones.length} zones</span>
            </div>
            <h1 className="hero-title text-4xl sm:text-5xl text-zinc-100 tracking-tight mb-2">
              Air Quality Zones
            </h1>
            <p className="text-zinc-500 text-[15px]">
              Manage monitoring zones and view estimated AQI values for each area.
            </p>
          </div>
          <Link
            href="/zones/new"
            className="glow-btn inline-flex items-center gap-2 px-5 py-3 bg-emerald-500 text-zinc-950 font-semibold rounded-xl text-sm flex-shrink-0"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
            </svg>
            New Zone
          </Link>
        </div>

        {/* AQI summary pills */}
        <div
          style={{ animation: mounted ? 'fadeSlideUp 0.4s ease 60ms both' : 'none' }}
          className="flex flex-wrap gap-2 mb-7"
        >
          {[
            { label: 'Good',     count: goodCount,     color: '#34d399' },
            { label: 'Moderate', count: moderateCount, color: '#fbbf24' },
            { label: 'Poor',     count: poorCount,     color: '#f97316' },
            { label: 'Severe',   count: severeCount,   color: '#f87171' },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold"
              style={{ backgroundColor: `${s.color}10`, borderColor: `${s.color}25`, color: s.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.count} {s.label}
            </div>
          ))}
        </div>

        {/* Land use filter pills */}
        {zones.length > 0 && (
          <div
            style={{ animation: mounted ? 'fadeSlideUp 0.4s ease 100ms both' : 'none' }}
            className="flex flex-wrap gap-1.5 mb-5"
          >
            {FILTERS.map((f) => {
              const active = filter === f
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="filter-pill px-3 py-1 rounded-lg text-xs font-semibold capitalize"
                  style={{
                    backgroundColor: active ? 'rgba(52,211,153,0.12)' : 'rgba(39,39,42,0.5)',
                    borderColor: active ? 'rgba(52,211,153,0.3)' : 'rgba(63,63,70,0.5)',
                    border: '1px solid',
                    color: active ? '#34d399' : '#71717a',
                  }}
                >
                  {f === 'all' ? 'All' : f.replace('_', ' ')}
                  {f !== 'all' && (
                    <span className="ml-1.5 opacity-60">
                      {zones.filter((z) => z.land_use_type === f).length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {zones.length === 0 ? (
          <div
            style={{ animation: mounted ? 'fadeSlideUp 0.4s ease 120ms both' : 'none' }}
            className="rounded-2xl border border-dashed border-zinc-700/50 bg-zinc-900/30 p-16 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center mx-auto mb-5">
              <svg width="22" height="22" fill="none" stroke="#52525b" strokeWidth="1.8" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <p className="text-zinc-400 font-semibold mb-2">No zones created yet</p>
            <p className="text-zinc-600 text-sm mb-7">Create your first zone to start monitoring air quality estimates.</p>
            <Link
              href="/zones/new"
              className="glow-btn inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-zinc-950 font-semibold rounded-xl text-sm"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
              </svg>
              Create First Zone
            </Link>
          </div>
        ) : filteredZones.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-10 text-center">
            <p className="text-zinc-500 text-sm">No zones match this filter.</p>
            <button onClick={() => setFilter('all')} className="mt-3 text-emerald-500 text-xs font-semibold hover:text-emerald-400 transition-colors">
              Clear filter
            </button>
          </div>
        ) : (
          <div
            style={{ animation: mounted ? 'fadeSlideUp 0.4s ease 140ms both' : 'none' }}
            className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden"
          >
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-zinc-800/60 bg-zinc-900/60">
              {[
                { label: 'Zone Name',  span: 4 },
                { label: 'Type',       span: 2 },
                { label: 'Traffic',    span: 2 },
                { label: 'Population', span: 2 },
                { label: 'AQI',        span: 1 },
                { label: '',           span: 1 },
              ].map((col, i) => (
                <div
                  key={i}
                  className={`col-span-${col.span} text-[10px] font-bold text-zinc-600 uppercase tracking-[0.15em]`}
                >
                  {col.label}
                </div>
              ))}
            </div>

            {/* Rows */}
            {filteredZones.map((zone, index) => (
              <ZoneRow
                key={zone.id}
                zone={zone}
                estimate={estimates.get(zone.id)}
                index={index}
              />
            ))}

            {/* Footer count */}
            <div className="px-6 py-3 border-t border-zinc-800/40 bg-zinc-900/40 flex items-center justify-between">
              <span className="text-[11px] text-zinc-600">
                Showing <span className="text-zinc-400 font-semibold">{filteredZones.length}</span> of{' '}
                <span className="text-zinc-400 font-semibold">{zones.length}</span> zones
              </span>
              <Link href="/zones/new" className="text-[11px] text-emerald-600 hover:text-emerald-500 font-semibold transition-colors">
                + Add zone
              </Link>
            </div>
          </div>
        )}

      </main>
      <FooterDisclaimer />
    </div>
  )
}