'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export function NavBar() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/zones', label: 'Zones' },
    { href: '/analysis', label: 'Analysis' },
    { href: '/simulation', label: 'Simulation' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap');
        .nav-font { font-family: 'DM Sans', sans-serif; }
        .brand-font { font-family: 'DM Serif Display', serif; }
        .nav-link-active {
          color: #34d399;
          background: rgba(52,211,153,0.08);
        }
        .nav-link-idle {
          color: #a1a1aa;
        }
        .nav-link-idle:hover {
          color: #e4e4e7;
          background: rgba(255,255,255,0.05);
        }
        .mobile-menu-enter {
          animation: mobileSlide 0.2s ease both;
        }
        @keyframes mobileSlide {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <nav
        style={{
          backgroundColor: scrolled ? 'rgba(9,9,11,0.92)' : 'rgba(9,9,11,0.8)',
          borderBottomColor: scrolled ? 'rgba(39,39,42,0.8)' : 'rgba(39,39,42,0.4)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
          boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.4)' : 'none',
        }}
        className="nav-font sticky top-0 z-50 border-b"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">

            {/* Brand */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group"
              style={{ textDecoration: 'none' }}
            >
              {/* Icon mark */}
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #059669, #34d399)',
                  boxShadow: '0 0 12px rgba(52,211,153,0.3)',
                  transition: 'box-shadow 0.2s ease',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
              <span
                className="brand-font text-[18px] tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #e4e4e7 0%, #a1a1aa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  transition: 'filter 0.2s ease',
                }}
              >
                Breathe Map
              </span>
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-0.5">
              {links.map((link) => {
                const active = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'relative px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150',
                      active ? 'nav-link-active' : 'nav-link-idle'
                    )}
                  >
                    {link.label}
                    {active && (
                      <span
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400"
                        style={{ bottom: '3px' }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors"
              aria-label="Toggle menu"
            >
              <span
                className="w-4 h-0.5 rounded-full bg-zinc-400 transition-all duration-200"
                style={{ transform: mobileOpen ? 'rotate(45deg) translateY(4px)' : 'none' }}
              />
              <span
                className="w-4 h-0.5 rounded-full bg-zinc-400 transition-all duration-200"
                style={{ opacity: mobileOpen ? 0 : 1 }}
              />
              <span
                className="w-4 h-0.5 rounded-full bg-zinc-400 transition-all duration-200"
                style={{ transform: mobileOpen ? 'rotate(-45deg) translateY(-4px)' : 'none' }}
              />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="mobile-menu-enter md:hidden border-t border-zinc-800/60 bg-zinc-950/95 backdrop-blur-md px-4 py-3"
          >
            {links.map((link) => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-all duration-150',
                    active ? 'nav-link-active' : 'nav-link-idle'
                  )}
                >
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />}
                  {!active && <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 flex-shrink-0" />}
                  {link.label}
                </Link>
              )
            })}
          </div>
        )}
      </nav>
    </>
  )
}