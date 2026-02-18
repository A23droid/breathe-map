'use client'

import { useState, useEffect } from 'react'
import { NavBar } from '@/components/nav-bar'
import { DisclaimerBanner } from '@/components/disclaimer-banner'
import { FooterDisclaimer } from '@/components/footer-disclaimer'
import { ZoneCluster, AQICorrelation } from '@/lib/types'

// Animated correlation bar row
function CorrelationRow({ correlation, index }: { correlation: AQICorrelation; index: number }) {
  const [barWidth, setBarWidth] = useState(0)
  const [hovered, setHovered] = useState(false)

  const isPositive = correlation.correlation_coefficient > 0
  const absValue = Math.abs(correlation.correlation_coefficient)
  const color = isPositive ? '#f97316' : '#34d399'

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(absValue * 100), 200 + index * 80)
    return () => clearTimeout(t)
  }, [absValue, index])

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: hovered ? 'translateX(4px)' : 'translateX(0)',
        transition: 'transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease',
        borderColor: hovered ? `${color}30` : 'rgba(255,255,255,0.06)',
        backgroundColor: hovered ? `${color}06` : 'rgba(255,255,255,0.02)',
        animationDelay: `${index * 60}ms`,
      }}
      className="rounded-xl border p-5 cursor-default"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-4">
          <p className="font-semibold text-zinc-200 text-[15px]">{correlation.factor}</p>
          <p className="text-sm text-zinc-500 mt-0.5 leading-relaxed">{correlation.description}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-bold tabular-nums" style={{ color }}>
            {isPositive ? '+' : ''}{correlation.correlation_coefficient.toFixed(2)}
          </p>
          <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: `${color}80` }}>
            {isPositive ? 'positive' : 'negative'}
          </p>
        </div>
      </div>

      {/* Bidirectional bar */}
      <div className="flex items-center gap-3">
        {!isPositive && (
          <div
            className="h-1.5 rounded-full flex-1 bg-zinc-800/60 overflow-hidden"
            style={{ maxWidth: '50%', marginLeft: 'auto' }}
          >
            <div
              className="h-full rounded-full ml-auto transition-all duration-700 ease-out"
              style={{ width: `${barWidth}%`, backgroundColor: color }}
            />
          </div>
        )}
        <div className="h-px w-px bg-zinc-700" />
        {isPositive && (
          <div className="h-1.5 rounded-full flex-1 bg-zinc-800/60 overflow-hidden" style={{ maxWidth: '50%' }}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${barWidth}%`, backgroundColor: color }}
            />
          </div>
        )}
      </div>

      {/* Strength label */}
      <div className="mt-2 flex justify-end">
        <span
          className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${color}12`, color }}
        >
          {absValue >= 0.7 ? 'Strong' : absValue >= 0.4 ? 'Moderate' : 'Weak'}
        </span>
      </div>
    </div>
  )
}

// Cluster card
function ClusterCard({ cluster, zoneLookup, index }: { cluster: ZoneCluster; zoneLookup: Record<string, string>; index: number }) {
  const [hovered, setHovered] = useState(false)

  const aqiColor =
    cluster.average_aqi <= 50  ? '#34d399' :
    cluster.average_aqi <= 100 ? '#fbbf24' :
    cluster.average_aqi <= 150 ? '#f97316' : '#f87171'

  const clusterColors = ['#818cf8', '#34d399', '#fbbf24', '#f97316']
  const accent = clusterColors[index % clusterColors.length]

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease, border-color 0.2s ease',
        boxShadow: hovered ? `0 12px 32px rgba(0,0,0,0.3), 0 0 0 1px ${accent}20` : '0 2px 8px rgba(0,0,0,0.15)',
        borderColor: hovered ? `${accent}30` : 'rgba(255,255,255,0.07)',
        animationDelay: `${index * 100}ms`,
      }}
      className="rounded-2xl border bg-zinc-900/60 p-6 cursor-default overflow-hidden relative"
    >
      {/* Accent left bar */}
      <div className="absolute top-0 left-0 w-0.5 h-full rounded-l-2xl" style={{ backgroundColor: accent }} />
      {/* Glow */}
      <div
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl transition-opacity duration-300"
        style={{ backgroundColor: accent, opacity: hovered ? 0.08 : 0.03 }}
      />

      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
              style={{ backgroundColor: `${accent}20`, color: accent, border: `1px solid ${accent}30` }}
            >
              {cluster.cluster_id}
            </div>
            <h3 className="text-[15px] font-semibold text-zinc-200">Cluster {cluster.cluster_id}</h3>
          </div>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-sm">{cluster.characteristics}</p>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
          <p className="text-xs text-zinc-500 mb-1">Avg AQI</p>
          <p className="text-3xl font-bold tabular-nums" style={{ color: aqiColor }}>{cluster.average_aqi}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
          Land Use:{' '}
          <span className="text-zinc-300 font-medium capitalize">{cluster.dominant_land_use.replace('_', ' ')}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
          <span className="text-zinc-300 font-medium">{cluster.zones.length}</span> zones
        </span>
      </div>

      {/* AQI mini bar */}
      <div className="h-1 rounded-full bg-zinc-800/60 overflow-hidden mb-4">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min((cluster.average_aqi / 200) * 100, 100)}%`,
            backgroundColor: aqiColor,
            transition: 'width 0.8s ease',
          }}
        />
      </div>

      {/* Zone tags — use zoneLookup from backend */}
      <div className="flex flex-wrap gap-1.5">
        {cluster.zones.map((zoneId) => (
          <span
            key={zoneId}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium"
            style={{ backgroundColor: `${accent}12`, color: accent, border: `1px solid ${accent}20` }}
          >
            {zoneLookup[zoneId] || `Zone ${zoneId.slice(0, 8)}`}
          </span>
        ))}
      </div>
    </div>
  )
}

// Methodology card — self-contained hover state
function MethodologyCard({ icon, color, title, desc }: { icon: React.ReactNode; color: string; title: string; desc: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform 0.25s ease, border-color 0.2s ease, box-shadow 0.25s ease',
        borderColor: hovered ? `${color}25` : 'rgba(255,255,255,0.07)',
        boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.25)' : 'none',
      }}
      className="rounded-2xl border bg-zinc-900/50 p-5 cursor-default"
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
        style={{ backgroundColor: `${color}15`, border: `1px solid ${color}20` }}
      >
        {icon}
      </div>
      <h4 className="font-semibold text-zinc-200 text-sm mb-1.5">{title}</h4>
      <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
    </div>
  )
}

export default function AnalysisPage() {
  const [correlations, setCorrelations] = useState<AQICorrelation[]>([])
  const [clusters, setClusters] = useState<ZoneCluster[]>([])
  const [zoneLookup, setZoneLookup] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        const [correlationRes, clusterRes] = await Promise.all([
          fetch('/api/analysis/correlations', { cache: 'no-store' }),
          fetch('/api/analysis/clusters', { cache: 'no-store' }),
        ])

        const correlationData = await correlationRes.json()
        const clusterData = await clusterRes.json()

        setCorrelations(correlationData.data ?? [])
        setClusters(clusterData.data ?? [])
        setZoneLookup(clusterData.zone_lookup ?? {})
      } catch (error) {
        console.error('Failed to load analysis:', error)
      } finally {
        setIsLoading(false)
        setMounted(true)
      }
    }

    void loadAnalysis()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          <p className="text-zinc-500 text-sm tracking-wide">Loading analysis…</p>
        </div>
      </div>
    )
  }

  const positiveCount = correlations.filter((c) => c.correlation_coefficient > 0).length
  const strongCount   = correlations.filter((c) => Math.abs(c.correlation_coefficient) >= 0.7).length

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

      <main className="body-font flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 md:py-14">

        {/* Header */}
        <div
          style={{ animation: mounted ? 'fadeSlideUp 0.5s ease both' : 'none' }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Exploratory</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-zinc-600 uppercase tracking-[0.15em]">Non-causal · Persisted zone data</span>
          </div>
          <h1 className="hero-title text-4xl sm:text-5xl text-zinc-100 tracking-tight mb-2">
            Pattern Analysis
          </h1>
          <p className="text-zinc-500 text-[15px] max-w-xl">
            Explore correlations between environmental factors and AQI patterns from persisted zone data.
          </p>
        </div>

        {/* Quick stats strip */}
        <div
          style={{ animation: mounted ? 'fadeSlideUp 0.5s ease 80ms both' : 'none' }}
          className="grid grid-cols-3 gap-3 mb-12"
        >
          {[
            { label: 'Factors Analyzed',     value: correlations.length, color: '#818cf8' },
            { label: 'Positive Correlations', value: positiveCount,       color: '#f97316' },
            { label: 'Strong Signals',         value: strongCount,         color: '#34d399' },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 px-5 py-4 text-center cursor-default"
            >
              <div className="text-2xl font-bold tabular-nums mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[11px] text-zinc-500 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── CORRELATION ANALYSIS ── */}
        <section className="mb-14">
          <div
            style={{ animation: mounted ? 'fadeSlideUp 0.5s ease 140ms both' : 'none' }}
            className="flex items-center gap-3 mb-7"
          >
            <h2 className="hero-title text-2xl sm:text-3xl text-zinc-100 tracking-tight">Factor Correlations</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-zinc-700/50 to-transparent" />
          </div>

          <div
            style={{ animation: mounted ? 'fadeSlideUp 0.5s ease 180ms both' : 'none' }}
            className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 mb-5"
          >
            {/* Legend */}
            <div className="flex items-center gap-6 mb-6 pb-5 border-b border-zinc-800/60">
              <div className="flex items-center gap-2">
                <div className="w-3 h-1.5 rounded-full bg-orange-500" />
                <span className="text-xs text-zinc-400">Positive — higher factor = higher AQI</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs text-zinc-400">Negative — higher factor = lower AQI</span>
              </div>
            </div>

            {correlations.length === 0 ? (
              <p className="text-zinc-600 text-sm text-center py-8">No correlation data available.</p>
            ) : (
              <div className="space-y-3">
                {correlations.map((correlation, index) => (
                  <CorrelationRow key={index} correlation={correlation} index={index} />
                ))}
              </div>
            )}
          </div>

          {/* Interpretation guide */}
          <div
            style={{ animation: mounted ? 'fadeSlideUp 0.5s ease 260ms both' : 'none' }}
            className="rounded-2xl border border-indigo-800/30 bg-indigo-950/20 p-5"
          >
            <h4 className="text-sm font-semibold text-indigo-300 mb-2 flex items-center gap-2">
              <svg width="14" height="14" fill="none" stroke="#818cf8" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01" strokeLinecap="round"/>
              </svg>
              Interpretation Guide
            </h4>
            <p className="text-sm text-zinc-400 mb-2 leading-relaxed">
              Correlation values range from <span className="text-zinc-200 font-medium">−1 to +1</span>. Positive values indicate that as one factor increases, AQI tends to increase. Negative values indicate inverse relationships.
            </p>
            <p className="text-xs text-zinc-500">
              <span className="text-amber-400 font-semibold">⚠ Important:</span> These are exploratory correlations and do not imply causation.
            </p>
          </div>
        </section>

        {/* ── ZONE CLUSTERS ── */}
        <section className="mb-14">
          <div
            style={{ animation: mounted ? 'fadeSlideUp 0.5s ease 300ms both' : 'none' }}
            className="flex items-center gap-3 mb-7"
          >
            <h2 className="hero-title text-2xl sm:text-3xl text-zinc-100 tracking-tight">Zone Clusters</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-zinc-700/50 to-transparent" />
          </div>

          <p
            style={{ animation: mounted ? 'fadeSlideUp 0.5s ease 340ms both' : 'none' }}
            className="text-zinc-500 text-sm mb-6 max-w-xl"
          >
            Zones grouped by similarity in estimated AQI levels and land use characteristics.
          </p>

          {clusters.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-10 text-center">
              <p className="text-zinc-600 text-sm">No cluster data available.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {clusters.map((cluster, i) => (
                <ClusterCard key={cluster.cluster_id} cluster={cluster} zoneLookup={zoneLookup} index={i} />
              ))}
            </div>
          )}

          {/* Clustering note */}
          <div
            style={{ animation: mounted ? 'fadeSlideUp 0.5s ease 420ms both' : 'none' }}
            className="mt-5 rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-5"
          >
            <p className="text-sm text-zinc-500 leading-relaxed">
              <span className="text-zinc-300 font-semibold">About Clustering: </span>
              Zones are grouped using land-use type and estimated AQI ranges.{' '}
              <span className="text-zinc-400">
                Clustering results are derived from persisted zone data. Real cluster analysis would require more sophisticated statistical methods.
              </span>
            </p>
          </div>
        </section>

        {/* ── METHODOLOGY ── */}
        <section>
          <div
            style={{ animation: mounted ? 'fadeSlideUp 0.5s ease 460ms both' : 'none' }}
            className="flex items-center gap-3 mb-7"
          >
            <h2 className="hero-title text-2xl sm:text-3xl text-zinc-100 tracking-tight">Methodology & Limitations</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-zinc-700/50 to-transparent" />
          </div>

          <div
            style={{ animation: mounted ? 'fadeSlideUp 0.5s ease 500ms both' : 'none' }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <MethodologyCard
              color="#818cf8"
              title="Correlation Calculation"
              desc="Correlations are computed from persisted zone data using theoretical relationships between factors and air quality."
              icon={
                <svg width="16" height="16" fill="none" stroke="#818cf8" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 3v18h18" strokeLinecap="round"/>
                  <path d="M7 16l4-4 4 4 4-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            />
            <MethodologyCard
              color="#34d399"
              title="Clustering Method"
              desc="Zones are grouped using land-use type and estimated AQI ranges as similarity metrics."
              icon={
                <svg width="16" height="16" fill="none" stroke="#34d399" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="9" cy="7" r="4"/><circle cx="17" cy="14" r="3"/><circle cx="6" cy="17" r="2.5"/>
                </svg>
              }
            />
            <MethodologyCard
              color="#60a5fa"
              title="Data Source"
              desc="Analyses use persisted zone data fetched from the backend API at runtime, not static mock values."
              icon={
                <svg width="16" height="16" fill="none" stroke="#60a5fa" strokeWidth="2" viewBox="0 0 24 24">
                  <ellipse cx="12" cy="5" rx="9" ry="3"/>
                  <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
                  <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
                </svg>
              }
            />
            <MethodologyCard
              color="#fbbf24"
              title="Important Disclaimer"
              desc="Results are exploratory and not suitable for policy or regulatory decisions. Always validate with real-world data."
              icon={
                <svg width="16" height="16" fill="none" stroke="#fbbf24" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round"/>
                </svg>
              }
            />
          </div>
        </section>

      </main>
      <FooterDisclaimer />
    </div>
  )
}