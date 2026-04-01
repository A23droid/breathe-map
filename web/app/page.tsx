'use client'

import Link from 'next/link'
import { NavBar } from '@/components/nav-bar'
import { FooterDisclaimer } from '@/components/footer-disclaimer'
import { useState, useEffect, useRef } from 'react'
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

// ─── FONT CONFIG ────────────────────────────────────────────────────────────
const FONT_IMPORT = 'Google+Sans:wght@300;400;500;600;700'
const FONT_DISPLAY = "'Google Sans', sans-serif"
const FONT_BODY = "'Google Sans', sans-serif"
// ────────────────────────────────────────────────────────────────────────────

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
        p.x += p.vx; p.y += p.vy
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
            ctx.strokeStyle = `rgba(134,239,172,${0.07 * (1 - dist / 120)})`
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
      style={{ opacity: 0.5 }}
    />
  )
}

function AQIRing({ value, label, color }: { value: number; label: string; color: string }) {
  const [displayed, setDisplayed] = useState(0)
  const circumference = 2 * Math.PI * 36

  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0
      const step = () => {
        start += 2
        if (start <= value) { setDisplayed(start); requestAnimationFrame(step) }
        else setDisplayed(value)
      }
      requestAnimationFrame(step)
    }, 400)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <div className="flex flex-col items-center gap-2.5 cursor-default">
      <div className="relative w-[72px] h-[72px] sm:w-20 sm:h-20">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="36" fill="none"
            stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (displayed / 100) * circumference}
            style={{ transition: 'stroke-dashoffset 0.05s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base sm:text-lg font-bold text-white tabular-nums" style={{ fontFamily: FONT_DISPLAY }}>
            {displayed}
          </span>
        </div>
      </div>
      <span className="text-[10px] sm:text-xs text-zinc-500 font-medium tracking-widest uppercase">{label}</span>
    </div>
  )
}

function CapabilityCard({ title, desc, index }: { title: string; desc: string; index: number }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        animationDelay: `${index * 80}ms`,
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease, border-color 0.2s ease',
        boxShadow: hovered
          ? '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(52,211,153,0.1)'
          : '0 2px 8px rgba(0,0,0,0.15)',
        borderColor: hovered ? 'rgba(52,211,153,0.15)' : 'rgba(63,63,70,0.5)',
      }}
      className="relative rounded-2xl p-6 sm:p-7 border overflow-hidden cursor-default bg-zinc-900/50"
    >
      <div
        className="absolute top-0 left-6 right-6 h-px rounded-full transition-opacity duration-300"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.3), transparent)',
          opacity: hovered ? 1 : 0,
        }}
      />
      <h3 className="font-semibold mb-2.5 text-sm text-zinc-100" style={{ fontFamily: FONT_DISPLAY }}>
        {title}
      </h3>
      <p className="text-zinc-500 text-[13.5px] leading-relaxed">{desc}</p>
    </div>
  )
}

function WorkflowStep({ num, title, text, isLast, index }: {
  num: string; title: string; text: string; isLast?: boolean; index: number
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ animationDelay: `${index * 100}ms` }}
      className="flex gap-5 sm:gap-6 cursor-default"
    >
      <div className="flex-shrink-0 flex flex-col items-center">
        <div
          style={{
            transform: hovered ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            fontFamily: FONT_DISPLAY,
          }}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-emerald-800/50 bg-emerald-950/60 flex items-center justify-center text-sm font-bold text-emerald-400"
        >
          {num}
        </div>
        {!isLast && (
          <div className="w-px flex-1 mt-3 bg-gradient-to-b from-zinc-700/40 to-transparent min-h-[24px]" />
        )}
      </div>
      <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-8'}`}>
        <h3
          style={{ color: hovered ? '#6ee7b7' : '#e4e4e7', transition: 'color 0.2s ease', fontFamily: FONT_DISPLAY }}
          className="font-semibold mb-1.5 text-[15px]"
        >
          {title}
        </h3>
        <p className="text-zinc-500 text-[13.5px] leading-relaxed">{text}</p>
      </div>
    </div>
  )
}

export default function Home() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${FONT_IMPORT}&display=swap');
        :root { --font-display: ${FONT_DISPLAY}; --font-body: ${FONT_BODY}; }

        @keyframes heroFade {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .hero-title { font-family: var(--font-display); }
        .body-font  { font-family: var(--font-body); }

        /* Unified gradient text — same stops used across hero + CTA */
        .gradient-text {
          background: linear-gradient(135deg, #6ee7b7 0%, #34d399 50%, #a7f3d0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Primary CTA */
        .glow-btn {
          box-shadow: 0 0 16px rgba(52,211,153,0.2), 0 4px 12px rgba(0,0,0,0.35);
          transition: box-shadow 0.25s ease, transform 0.2s ease;
        }
        .glow-btn:hover {
          box-shadow: 0 0 28px rgba(52,211,153,0.35), 0 8px 24px rgba(0,0,0,0.45);
          transform: translateY(-2px);
        }

        /* Secondary CTA */
        .outline-btn {
          transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
        }
        .outline-btn:hover {
          border-color: rgba(52,211,153,0.35);
          background-color: rgba(52,211,153,0.05);
          transform: translateY(-2px);
        }

        .mesh-bg {
          background:
            radial-gradient(ellipse 60% 50% at 20% 10%, rgba(16,100,60,0.15) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 80% 80%, rgba(30,58,80,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 40% 60% at 50% 40%, rgba(15,40,30,0.12) 0%, transparent 70%),
            #09090b;
        }

        .stat-card {
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(52,211,153,0.08);
        }

        .prose-width { max-width: 62ch; }
      `}</style>

      <NavBar />

      <main className="flex-1 body-font">

        {/* ── HERO ── */}
        <section className="relative mesh-bg overflow-hidden flex-1 flex items-center justify-center min-h-[calc(100vh-64px)]">
          <ParticleCanvas />

          {/* Decorative rings — softer opacity to not compete with content */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] rounded-full border border-emerald-900/15 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] sm:w-[1100px] sm:h-[1100px] rounded-full border border-emerald-900/8 pointer-events-none" />

          <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 text-center">

            {/* Badge — uses same muted green as nav city chip for coherence */}


            {/* Title */}
            <h1
              style={{ animation: mounted ? 'heroFade 0.7s ease 0.2s both' : 'none' }}
              className="hero-title text-[clamp(3rem,10vw,6rem)] font-extrabold tracking-tight leading-[1.02] mb-5"
            >
              <span className="text-zinc-100">Breathe</span>
              {' '}
              <span className="gradient-text">Map</span>
            </h1>

            {/* Subtitle */}
            <p
              style={{ animation: mounted ? 'heroFade 0.7s ease 0.35s both' : 'none' }}
              className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-10 sm:mb-12 prose-width"
            >
              Map-based air quality modelling. Zone configuration, deterministic AQI estimation,
              factor correlation analysis, and intervention simulation — built for learning and exploration.
            </p>

            {/* CTAs */}
            <div
              style={{ animation: mounted ? 'heroFade 0.7s ease 0.5s both' : 'none' }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-16 sm:mb-20"
            >
              <Link
                href="/dashboard"
                className="glow-btn inline-flex items-center justify-center px-7 sm:px-8 py-3.5 sm:py-4 w-full sm:w-auto sm:min-w-[190px] bg-emerald-500 text-zinc-950 font-semibold rounded-xl text-sm sm:text-[15px] hero-title"
              >
                Open Dashboard
              </Link>
              <Link
                href="/zones"
                className="outline-btn inline-flex items-center justify-center px-7 sm:px-8 py-3.5 sm:py-4 w-full sm:w-auto sm:min-w-[190px] border border-zinc-700/80 text-zinc-300 font-semibold rounded-xl text-sm sm:text-[15px] hero-title"
              >
                Explore Zones
              </Link>
            </div>
          </div>
        </section>

        {/* ── CAPABILITIES ── */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center mb-10 sm:mb-12">
            {/* Eyebrow — muted green, not full #34d399 saturation */}
            <p className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase mb-2.5" style={{ color: '#6ee7b7' }}>
              What&apos;s Inside
            </p>
            <h2 className="hero-title text-3xl sm:text-4xl md:text-[2.75rem] text-zinc-100 tracking-tight">
              Core Capabilities
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "Zone Configuration", desc: "Define monitoring areas using land-use, traffic density, population, and road network parameters." },
              { title: "Deterministic AQI", desc: "Transparent, formula-based AQI calculation with visible contribution of each input factor." },
              { title: "Correlation & Clustering", desc: "Identify relationships between variables and group zones by air quality behaviour." },
              { title: "Intervention Simulation", desc: "Test hypothetical changes — reduced traffic, increased greenery, altered road patterns — and observe estimated outcomes." },
              { title: "Calculation Transparency", desc: "Every AQI value is traceable to its exact contributing weights and input values." },
              { title: "Exploratory Scope", desc: "Uses modeled data to provide exploratory insights and scenario-based air-quality estimates." },
            ].map((item, i) => (
              <CapabilityCard key={i} index={i} title={item.title} desc={item.desc} />
            ))}
          </div>
        </section>

        {/* ── STATS STRIP ── */}
        <section className="border-y border-zinc-800/50 bg-zinc-900/20">
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
              {[
                { value: '6', unit: '+', label: 'Input Parameters' },
                { value: '4', unit: '', label: 'Workflow Stages' },
                { value: '100', unit: '%', label: 'Transparent Calc' },
                { value: '0', unit: '', label: 'Real-World Data' },
              ].map((s, i) => (
                <div key={i} className="stat-card text-center py-5 sm:py-6 px-3 sm:px-4 rounded-xl border border-zinc-800/40 bg-zinc-900/40 cursor-default">
                  <div className="hero-title text-3xl sm:text-4xl md:text-5xl text-emerald-400 mb-1.5 sm:mb-2">
                    {s.value}<span className="text-xl sm:text-2xl text-emerald-700">{s.unit}</span>
                  </div>
                  <div className="text-[10px] sm:text-xs text-zinc-600 font-medium tracking-widest uppercase">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WORKFLOW ── */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
            <div className="lg:sticky lg:top-24 lg:w-64 xl:w-72 flex-shrink-0">
              <p className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase mb-2.5" style={{ color: '#6ee7b7' }}>
                How It Works
              </p>
              <h2 className="hero-title text-3xl sm:text-[2rem] text-zinc-100 tracking-tight mb-3">
                Simple, Transparent Workflow
              </h2>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Four stages from zone definition to intervention testing, every calculation fully traceable.
              </p>
            </div>

            <div className="flex-1 min-w-0">
              {[
                { num: "1", title: "Configure zones", text: "Specify land use, traffic intensity, population density and street layout." },
                { num: "2", title: "Calculate AQI", text: "Review the step-by-step contribution of each parameter to the final index." },
                { num: "3", title: "Analyze patterns", text: "Examine correlations and observe how zones naturally group." },
                { num: "4", title: "Simulate change", text: "Modify input variables and compare before/after estimates." },
              ].map((step, i, arr) => (
                <WorkflowStep key={i} index={i} num={step.num} title={step.title} text={step.text} isLast={i === arr.length - 1} />
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="relative overflow-hidden border-t border-zinc-800/50">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] sm:w-[700px] h-[260px] bg-emerald-900/15 blur-[80px] rounded-full" />
          </div>

          <div className="relative w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 md:py-28 text-center">
            <p className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: '#6ee7b7' }}>
              Get Started
            </p>
            <h2 className="hero-title text-3xl sm:text-4xl md:text-5xl text-zinc-100 tracking-tight mb-4 sm:mb-5">
              Start Modelling
            </h2>
            <p className="text-zinc-500 mb-8 sm:mb-10 max-w-md mx-auto text-sm sm:text-[15px] leading-relaxed">
              Open the dashboard to view analytics, or begin by creating and configuring your first zone.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-10 sm:mb-12">
              <Link
                href="/dashboard"
                className="glow-btn inline-flex items-center justify-center px-7 sm:px-9 py-3.5 sm:py-4 w-full sm:w-auto bg-emerald-500 text-zinc-950 font-semibold rounded-xl text-sm sm:text-[15px] hero-title"
              >
                View Dashboard
              </Link>
              <Link
                href="/zones"
                className="outline-btn inline-flex items-center justify-center px-7 sm:px-9 py-3.5 sm:py-4 w-full sm:w-auto border border-zinc-700/80 text-zinc-300 font-semibold rounded-xl text-sm sm:text-[15px] hero-title"
              >
                Create Zone
              </Link>
            </div>

            <p className="text-xs text-zinc-700 max-w-sm mx-auto leading-relaxed">
              Educational simulation tool using synthetic data and simplified relationships.
            </p>
          </div>
        </section>

      </main>

      <FooterDisclaimer />
    </div>

  )
}