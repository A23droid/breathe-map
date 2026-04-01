'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useCity } from '@/context/CityContext'
import { AddCityModal } from '@/components/AddCityModal'
import { ExportModal } from '@/components/ExportModal'

// ─── FONT CONFIG ────────────────────────────────────────────────────────────
const FONT_IMPORT = 'Google+Sans:wght@400;500;600;700'
const FONT_DISPLAY = "'Google Sans', sans-serif"
const FONT_BODY = "'Google Sans', sans-serif"
// ────────────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/zones', label: 'Zones' },
  { href: '/analysis', label: 'Analysis' },
  { href: '/simulation', label: 'Simulation' },
]

function PinIcon({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function BrandMark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
      <span
        className="text-[17px] lg:text-[18px] font-semibold tracking-tight"
        style={{
          fontFamily: FONT_DISPLAY,
          background: 'linear-gradient(135deg, #e4e4e7 0%, #a1a1aa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Breathe Map
      </span>
    </Link>
  )
}

export function NavBar() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false)
  const [addCityOpen, setAddCityOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const { currentCity, cities, setCurrentCity } = useCity()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
      <AddCityModal open={addCityOpen} onClose={() => setAddCityOpen(false)} />
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${FONT_IMPORT}&display=swap');
        :root { --font-display: ${FONT_DISPLAY}; --font-body: ${FONT_BODY}; }
        .nav-font { font-family: var(--font-body); }

        /* Desktop nav links */
        .nav-link-active { color: #34d399; background: rgba(52,211,153,0.08); }
        .nav-link-idle   { color: #71717a; }
        .nav-link-idle:hover { color: #d4d4d8; background: rgba(255,255,255,0.04); }

        /* City buttons in desktop dropdown */
        .city-btn-active { color: #34d399; background: rgba(52,211,153,0.08); border-color: rgba(52,211,153,0.2); }
        .city-btn-idle   { color: #71717a; background: transparent; border-color: rgba(63,63,70,0.4); }
        .city-btn-idle:hover { color: #d4d4d8; border-color: rgba(63,63,70,0.7); }

        /* Mobile overlay animations */
        @keyframes overlayIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        .overlay-enter { animation: overlayIn 0.22s cubic-bezier(0.16,1,0.3,1) both; }

        @keyframes backdropIn { from { opacity: 0; } to { opacity: 1; } }
        .backdrop-enter { animation: backdropIn 0.2s ease both; }

        /* Mobile nav link styles */
        .mobile-link-active { color: #34d399; }
        .mobile-link-idle   { color: #d4d4d8; }
        .mobile-link-idle:hover { color: #f4f4f5; }

        /* Mobile city pill buttons */
        .mobile-city-active { color: #34d399; background: rgba(52,211,153,0.08); border-color: rgba(52,211,153,0.2); }
        .mobile-city-idle   { color: #71717a; background: transparent; border-color: rgba(63,63,70,0.4); }
        .mobile-city-idle:hover { color: #d4d4d8; border-color: rgba(63,63,70,0.7); }
      `}</style>

      {/* ── Top navbar ─────────────────────────────────────────────────────── */}
      <nav
        className="nav-font sticky top-0 z-40 border-b"
        style={{
          backgroundColor: scrolled ? 'rgba(9,9,11,0.88)' : 'rgba(9,9,11,0.5)',
          borderBottomColor: scrolled ? 'rgba(39,39,42,0.6)' : 'rgba(39,39,42,0.2)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          transition: 'background-color 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease',
          boxShadow: scrolled ? '0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.3)' : 'none',
        }}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">

            <BrandMark />

            {/* ── Desktop nav + city (lg+) ── */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150',
                      active ? 'nav-link-active' : 'nav-link-idle',
                    )}
                    style={{ fontFamily: FONT_DISPLAY }}
                  >
                    {link.label}
                  </Link>
                )
              })}

              {/* City selector + Add City + Export */}
              <div className="relative z-50 ml-4 pl-4 border-l border-zinc-800/60 flex items-center gap-1">
                <button
                  onClick={() => setCityDropdownOpen((v) => !v)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors duration-150"
                  style={{
                    fontFamily: FONT_DISPLAY,
                    color: '#6ee7b7',
                    background: 'transparent',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(52,211,153,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <PinIcon size={11} color="#6ee7b7" />
                  <span>{currentCity.name}</span>
                  <svg
                    width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{
                      opacity: 0.5,
                      transform: cityDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Add City — icon-only with tooltip (desktop toolbar) */}
                <button
                  onClick={() => { setCityDropdownOpen(false); setAddCityOpen(true) }}
                  title="Add new city"
                  aria-label="Add new city"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:text-emerald-400 hover:bg-zinc-800/50 transition-colors"
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </button>

                {/* Export — icon-only with tooltip (desktop toolbar) */}
                <button
                  onClick={() => setExportOpen(true)}
                  title="Export report"
                  aria-label="Export report"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:text-emerald-400 hover:bg-zinc-800/50 transition-colors"
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" />
                    <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" />
                  </svg>
                </button>

                {cityDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setCityDropdownOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-zinc-800/50 bg-zinc-950/96 backdrop-blur-md shadow-xl z-50 py-1.5 overflow-hidden">
                      {cities.map((city) => (
                        <button
                          key={city.id}
                          onClick={() => { setCurrentCity(city.id); setCityDropdownOpen(false) }}
                          className={cn(
                            'w-full text-left px-4 py-2.5 text-[13px] transition-colors hover:bg-zinc-800/40',
                            city.id === currentCity.id
                              ? 'text-emerald-400 font-medium'
                              : 'text-zinc-500 hover:text-zinc-200',
                          )}
                          style={{ fontFamily: FONT_DISPLAY }}
                        >
                          {city.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Mobile: city chip + hamburger ── */}
            <div className="flex lg:hidden items-center gap-2.5">
              {/* Read-only city indicator */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium"
                style={{
                  fontFamily: FONT_DISPLAY,
                  color: '#6ee7b7',
                  background: 'rgba(52,211,153,0.06)',
                  border: '1px solid rgba(52,211,153,0.12)',
                }}
              >
                <PinIcon size={10} color="#6ee7b7" />
                {currentCity.name}
              </div>

              {/* Hamburger toggle — icon-only (allowed by spec) */}
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex flex-col justify-center items-center w-10 h-10 gap-[5px] rounded-lg transition-colors"
                style={{ background: menuOpen ? 'rgba(255,255,255,0.06)' : 'transparent' }}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
              >
                <span
                  className="w-[16px] h-0.5 rounded-full bg-zinc-400 transition-all duration-200 origin-center"
                  style={{ transform: menuOpen ? 'rotate(45deg) translateY(5px)' : 'none' }}
                />
                <span
                  className="w-[16px] h-0.5 rounded-full bg-zinc-400 transition-all duration-200"
                  style={{ opacity: menuOpen ? 0 : 1 }}
                />
                <span
                  className="w-[16px] h-0.5 rounded-full bg-zinc-400 transition-all duration-200 origin-center"
                  style={{ transform: menuOpen ? 'rotate(-45deg) translateY(-5px)' : 'none' }}
                />
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* ── Mobile fullscreen centered overlay ─────────────────────────────── */}
      {menuOpen && (
        <>
          {/* Backdrop — click to dismiss */}
          <div
            className="backdrop-enter lg:hidden fixed inset-0 z-40 bg-black/65"
            style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Overlay — centered content column */}
          <div
            className="overlay-enter lg:hidden fixed inset-0 z-50 flex flex-col items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Close button — top-right, icon-only (allowed by spec) */}
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
              aria-label="Close menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* ── Nav links ── large, centered */}
            <nav aria-label="Mobile navigation" className="flex flex-col items-center gap-0.5 mb-10 w-full px-6">
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'w-full max-w-xs text-center px-6 rounded-2xl text-[22px] font-semibold transition-all duration-150',
                      active ? 'mobile-link-active' : 'mobile-link-idle',
                    )}
                    style={{ fontFamily: FONT_DISPLAY, minHeight: '56px', lineHeight: '56px' }}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>

            {/* Divider */}
            <div className="w-full max-w-xs h-px bg-zinc-800/60 mb-7" />

            {/* ── City selector ── */}
            <div className="flex flex-col items-center gap-3 w-full px-6 mb-7">
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.18em]" style={{ fontFamily: FONT_DISPLAY }}>
                Select City
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {cities.map((city) => {
                  const active = city.id === currentCity.id
                  return (
                    <button
                      key={city.id}
                      onClick={() => { setCurrentCity(city.id); setMenuOpen(false) }}
                      className={cn(
                        'px-5 rounded-xl text-[14px] font-medium transition-all duration-150 border',
                        active ? 'mobile-city-active' : 'mobile-city-idle',
                      )}
                      style={{ fontFamily: FONT_DISPLAY, minHeight: '42px' }}
                    >
                      {city.name}
                    </button>
                  )
                })}
              </div>

              {/* Add City — text only */}
              <button
                onClick={() => { setMenuOpen(false); setAddCityOpen(true) }}
                className="text-[13px] text-emerald-500 hover:text-emerald-400 font-semibold transition-colors"
                style={{ fontFamily: FONT_DISPLAY }}
              >
                Add City
              </button>
            </div>

            {/* Divider */}
            <div className="w-full max-w-xs h-px bg-zinc-800/60 mb-7" />

            {/* Export Report — text only */}
            <button
              onClick={() => { setMenuOpen(false); setExportOpen(true) }}
              className="text-[14px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
              style={{ fontFamily: FONT_DISPLAY }}
            >
              Export Report
            </button>

            {/* Footer disclaimer */}
            <p
              className="absolute bottom-6 text-[11px] text-zinc-700 leading-relaxed text-center px-8"
              style={{ fontFamily: FONT_BODY }}
            >
              Educational simulation only. Not for regulatory use.
            </p>
          </div>
        </>
      )}
    </>
  )
}