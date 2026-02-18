'use client'

import Link from 'next/link'
import { NavBar } from '@/components/nav-bar'
import { DisclaimerBanner } from '@/components/disclaimer-banner'
import { FooterDisclaimer } from '@/components/footer-disclaimer'
import { useState, useEffect, useRef } from 'react'

// Animated particle canvas for hero background
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const particles: { x: number; y: number; r: number; vx: number; vy: number; opacity: number }[] = []

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.4 + 0.1,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(134,239,172,${p.opacity})`
        ctx.fill()
      })
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(134,239,172,${0.08 * (1 - dist / 120)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  )
}

// Animated AQI gauge ring
function AQIRing({ value, label, color }: { value: number; label: string; color: string }) {
  const [displayed, setDisplayed] = useState(0)
  const circumference = 2 * Math.PI * 36

  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0
      const step = () => {
        start += 2
        if (start <= value) {
          setDisplayed(start)
          requestAnimationFrame(step)
        } else {
          setDisplayed(value)
        }
      }
      requestAnimationFrame(step)
    }, 400)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <div className="flex flex-col items-center gap-2 group cursor-default">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="36"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (displayed / 100) * circumference}
            style={{ transition: 'stroke-dashoffset 0.05s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-white tabular-nums">{displayed}</span>
        </div>
      </div>
      <span className="text-xs text-zinc-400 font-medium tracking-wide uppercase">{label}</span>
    </div>
  )
}

// Hover-animated capability card
function CapabilityCard({ title, desc, highlight, index }: { title: string; desc: string; highlight?: boolean; index: number }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        animationDelay: `${index * 80}ms`,
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease, border-color 0.2s ease',
        boxShadow: hovered
          ? highlight
            ? '0 12px 40px rgba(217,119,6,0.15), 0 4px 12px rgba(0,0,0,0.3)'
            : '0 12px 40px rgba(134,239,172,0.08), 0 4px 12px rgba(0,0,0,0.3)'
          : '0 2px 8px rgba(0,0,0,0.2)',
      }}
      className={`
        relative rounded-2xl p-7 border overflow-hidden cursor-default
        ${highlight
          ? 'border-amber-700/50 bg-gradient-to-br from-amber-950/40 to-zinc-900/80'
          : 'border-zinc-800/60 bg-gradient-to-br from-zinc-900/80 to-zinc-950/90'
        }
        ${hovered ? (highlight ? 'border-amber-600/70' : 'border-emerald-800/50') : ''}
      `}
    >
      <div
        className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl transition-opacity duration-300
          ${highlight ? 'bg-amber-600/20' : 'bg-emerald-500/10'}
          ${hovered ? 'opacity-100' : 'opacity-0'}
        `}
      />
      {highlight && (
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-amber-700 rounded-l-2xl" />
      )}
      <h3 className={`font-semibold mb-3 text-[15px] tracking-wide ${highlight ? 'text-amber-300' : 'text-zinc-100'}`}>
        {title}
      </h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
    </div>
  )
}

// Workflow step
function WorkflowStep({ num, title, text, index }: { num: string; title: string; text: string; index: number }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ animationDelay: `${index * 100}ms` }}
      className="flex gap-6 group cursor-default"
    >
      <div className="flex-shrink-0 mt-0.5">
        <div
          style={{
            transform: hovered ? 'scale(1.15)' : 'scale(1)',
            transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          }}
          className="w-10 h-10 rounded-full border border-emerald-700/60 bg-emerald-950/50 flex items-center justify-center text-sm font-bold text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.15)]"
        >
          {num}
        </div>
      </div>
      <div className="pb-8 border-b border-zinc-800/50 flex-1 last:border-0 last:pb-0">
        <h3
          style={{ color: hovered ? '#6ee7b7' : '#f4f4f5', transition: 'color 0.2s ease' }}
          className="font-semibold mb-1.5 text-[15px] tracking-wide"
        >
          {title}
        </h3>
        <p className="text-zinc-500 text-sm leading-relaxed">{text}</p>
      </div>
    </div>
  )
}

export default function Home() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroFade {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-title { font-family: 'DM Serif Display', serif; }
        .body-font  { font-family: 'DM Sans', sans-serif; }
        .gradient-text {
          background: linear-gradient(135deg, #86efac 0%, #34d399 40%, #6ee7b7 80%, #a7f3d0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .glow-btn {
          box-shadow: 0 0 20px rgba(52,211,153,0.25), 0 4px 12px rgba(0,0,0,0.4);
          transition: box-shadow 0.25s ease, transform 0.2s ease, background-color 0.2s ease;
        }
        .glow-btn:hover {
          box-shadow: 0 0 32px rgba(52,211,153,0.45), 0 8px 24px rgba(0,0,0,0.5);
          transform: translateY(-2px);
        }
        .outline-btn {
          transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
        }
        .outline-btn:hover {
          border-color: rgba(52,211,153,0.5);
          background-color: rgba(52,211,153,0.06);
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        }
        .mesh-bg {
          background:
            radial-gradient(ellipse 60% 50% at 20% 10%, rgba(16,100,60,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 80% 80%, rgba(30,58,80,0.2) 0%, transparent 70%),
            radial-gradient(ellipse 40% 60% at 50% 40%, rgba(15,40,30,0.15) 0%, transparent 70%),
            #09090b;
        }
        .stat-card {
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 30px rgba(52,211,153,0.12), 0 2px 8px rgba(0,0,0,0.3);
        }
      `}</style>

      <NavBar />
      <DisclaimerBanner />

      <main className="flex-1 body-font">

        {/* ── HERO ── */}
        <section className="relative mesh-bg overflow-hidden">
          <ParticleCanvas />

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-emerald-900/20 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-emerald-900/10 pointer-events-none" />

          <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-24 pb-32 md:pt-36 md:pb-44 text-center">

            <div
              style={{ animation: mounted ? 'heroFade 0.6s ease 0.1s both' : 'none' }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-800/50 bg-emerald-950/60 text-emerald-400 text-xs font-semibold tracking-widest uppercase mb-8 backdrop-blur-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Educational Simulation Platform
            </div>

            <h1
              style={{ animation: mounted ? 'heroFade 0.7s ease 0.2s both' : 'none' }}
              className="hero-title text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-medium tracking-tight leading-[1.04] mb-6"
            >
              <span className="text-zinc-100">Breathe</span>
              {' '}
              <span className="gradient-text">Map</span>
            </h1>

            <p
              style={{ animation: mounted ? 'heroFade 0.7s ease 0.35s both' : 'none' }}
              className="text-zinc-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-12"
            >
              Map-based air quality modelling. Zone configuration, deterministic AQI estimation,
              factor correlation analysis, and intervention simulation — built for learning and exploration.
            </p>

            <div
              style={{ animation: mounted ? 'heroFade 0.7s ease 0.5s both' : 'none' }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20"
            >
              <Link
                href="/dashboard"
                className="glow-btn inline-flex items-center justify-center gap-2.5 px-8 py-4 min-w-[200px] bg-emerald-500 text-zinc-950 font-semibold rounded-xl text-[15px] tracking-wide"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
                Open Dashboard
              </Link>
              <Link
                href="/zones"
                className="outline-btn inline-flex items-center justify-center gap-2.5 px-8 py-4 min-w-[200px] border border-zinc-700 text-zinc-200 font-semibold rounded-xl text-[15px] tracking-wide"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                Explore Zones
              </Link>
            </div>

            {/* Live AQI gauges strip */}
            <div
              style={{ animation: mounted ? 'heroFade 0.7s ease 0.65s both' : 'none' }}
              className="inline-flex flex-wrap justify-center gap-8 sm:gap-12 bg-white/[0.04] border border-white/[0.07] rounded-2xl px-10 py-6 backdrop-blur-sm"
            >
              <AQIRing value={42} label="Zone A" color="#34d399" />
              <AQIRing value={78} label="Zone B" color="#fbbf24" />
              <AQIRing value={61} label="Zone C" color="#60a5fa" />
              <AQIRing value={93} label="Zone D" color="#f87171" />
              <div className="hidden sm:flex flex-col justify-center items-start gap-1 pl-4 border-l border-white/10">
                <span className="text-[11px] text-zinc-500 uppercase tracking-widest font-medium">Simulated</span>
                <span className="text-[11px] text-zinc-500 uppercase tracking-widest font-medium">AQI Values</span>
                <span className="text-[10px] text-zinc-600 mt-1">Not real data</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── CAPABILITIES ── */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 py-24 md:py-36">
          <div className="text-center mb-16">
            <p className="text-emerald-500 text-xs font-bold tracking-[0.2em] uppercase mb-3">What&apos;s Inside</p>
            <h2 className="hero-title text-3xl sm:text-4xl md:text-5xl text-zinc-100 tracking-tight">
              Core Capabilities
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: "Zone Configuration",
                desc: "Define monitoring areas using land-use, traffic density, population, and road network parameters."
              },
              {
                title: "Deterministic AQI",
                desc: "Transparent, formula-based AQI calculation with visible contribution of each input factor."
              },
              {
                title: "Correlation & Clustering",
                desc: "Identify relationships between variables and group zones by air quality behaviour."
              },
              {
                title: "Intervention Simulation",
                desc: "Test hypothetical changes — reduced traffic, increased greenery, altered road patterns — and observe estimated outcomes."
              },
              {
                title: "Calculation Transparency",
                desc: "Every AQI value is traceable to its exact contributing weights and input values."
              },
              {
                title: "Educational Scope Only",
                desc: "Uses synthetic data and simplified models. Not intended for regulatory analysis or real-world decision-making.",
                highlight: true
              }
            ].map((item, i) => (
              <CapabilityCard key={i} index={i} title={item.title} desc={item.desc} highlight={item.highlight} />
            ))}
          </div>
        </section>

        {/* ── STATS STRIP ── */}
        <section className="border-y border-zinc-800/60 bg-zinc-900/30">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: '6', unit: '+', label: 'Input Parameters' },
                { value: '4', unit: '', label: 'Workflow Stages' },
                { value: '100', unit: '%', label: 'Transparent Calc' },
                { value: '0', unit: '', label: 'Real-World Data' },
              ].map((s, i) => (
                <div key={i} className="stat-card text-center py-6 px-4 rounded-xl border border-zinc-800/50 bg-zinc-900/50 cursor-default">
                  <div className="hero-title text-4xl sm:text-5xl text-emerald-400 mb-2">
                    {s.value}<span className="text-2xl text-emerald-600">{s.unit}</span>
                  </div>
                  <div className="text-xs text-zinc-500 font-medium tracking-widest uppercase">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WORKFLOW ── */}
        <section className="max-w-5xl mx-auto px-5 sm:px-8 py-24 md:py-36">
          <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-start">
            <div className="lg:sticky lg:top-24 lg:w-72 flex-shrink-0">
              <p className="text-emerald-500 text-xs font-bold tracking-[0.2em] uppercase mb-3">How It Works</p>
              <h2 className="hero-title text-3xl sm:text-4xl text-zinc-100 tracking-tight mb-4">
                Simple, Transparent Workflow
              </h2>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Four stages from zone definition to intervention testing — every calculation fully traceable.
              </p>
            </div>

            <div className="flex-1 min-w-0">
              {[
                { num: "1", title: "Configure zones", text: "Specify land use, traffic intensity, population density and street layout." },
                { num: "2", title: "Calculate AQI", text: "Review the step-by-step contribution of each parameter to the final index." },
                { num: "3", title: "Analyze patterns", text: "Examine correlations and observe how zones naturally group." },
                { num: "4", title: "Simulate change", text: "Modify input variables and compare before/after estimates." }
              ].map((step, i) => (
                <WorkflowStep key={i} index={i} num={step.num} title={step.title} text={step.text} />
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="relative overflow-hidden border-t border-zinc-800/60">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-900/20 blur-[80px] rounded-full" />
          </div>

          <div className="relative max-w-4xl mx-auto px-5 sm:px-8 py-24 md:py-36 text-center">
            <p className="text-emerald-500 text-xs font-bold tracking-[0.2em] uppercase mb-4">Get Started</p>
            <h2 className="hero-title text-3xl sm:text-4xl md:text-5xl text-zinc-100 tracking-tight mb-5">
              Start Modelling
            </h2>
            <p className="text-zinc-500 mb-12 max-w-lg mx-auto text-[15px] leading-relaxed">
              Open the dashboard to view analytics, or begin by creating and configuring your first zone.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
              <Link
                href="/dashboard"
                className="glow-btn inline-flex items-center justify-center gap-2.5 px-9 py-4 bg-emerald-500 text-zinc-950 font-semibold rounded-xl text-[15px] tracking-wide"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
                View Dashboard
              </Link>
              <Link
                href="/zones"
                className="outline-btn inline-flex items-center justify-center gap-2.5 px-9 py-4 border border-zinc-700 text-zinc-200 font-semibold rounded-xl text-[15px] tracking-wide"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
                Create Zone
              </Link>
            </div>

            <p className="text-xs text-zinc-600 max-w-xl mx-auto leading-relaxed">
              This is an educational simulation tool using synthetic data and simplified relationships.
              Results should not be used for policy, compliance, health advice or real-world planning.
            </p>
          </div>
        </section>

      </main>

      <FooterDisclaimer />
    </div>
  )
}