'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function NavBar() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/zones', label: 'Zones' },
    { href: '/analysis', label: 'Analysis' },
    { href: '/simulation', label: 'Simulation' },
  ]

  return (
    <nav className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
              <span className="text-2xl">🌍</span>
              Breathe Map
            </Link>
            <div className="hidden md:flex gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-secondary'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}