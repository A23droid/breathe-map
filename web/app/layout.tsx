import React from "react"
import type { Metadata, Viewport } from 'next'
import '../styles/globals.css'
import { CityProvider } from '@/context/CityContext'
import { ToasterProvider } from '@/components/toaster-provider'
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata: Metadata = {
  title: 'Breathe Map — Smart City Air Quality Simulation Platform',
  description: 'Breathe Map is a smart-city platform that visualizes and simulates air quality at a zone level using urban data, enabling data-driven environmental planning.',
  keywords: ['smart city', 'air quality', 'AQI', 'urban planning', 'GIS', 'pollution simulation'],
  metadataBase: new URL('https://breathe-map-w.vercel.app'),
  openGraph: {
    title: 'Breathe Map — Smart City Air Quality Simulation Platform',
    description: 'Visualize and simulate air quality at a zone level using urban data for data-driven environmental planning.',
    url: 'https://breathe-map-w.vercel.app',
    siteName: 'Breathe Map',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Breathe Map — Smart City Air Quality Simulation Platform',
    description: 'Visualize and simulate air quality at a zone level using urban data for data-driven environmental planning.',
  },
  icons: {
    icon: '/favicon.ico',
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#09090b',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-[#09090b] text-foreground flex flex-col min-h-screen">
        <CityProvider>
          <main className="flex-1 flex flex-col">{children}</main>
          <ToasterProvider />
          <Analytics />
          <SpeedInsights />
        </CityProvider>
      </body>
    </html>
  )
}