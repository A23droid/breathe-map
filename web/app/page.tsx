'use client'

import Link from 'next/link'
import { NavBar } from '@/components/nav-bar'
import { DisclaimerBanner } from '@/components/disclaimer-banner'
import { FooterDisclaimer } from '@/components/footer-disclaimer'

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 flex flex-col">
      <NavBar />
      <DisclaimerBanner />

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-20 pb-28 md:pt-28 md:pb-40">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-medium tracking-tight text-zinc-900 dark:text-zinc-100 leading-[1.08] mb-7">
              Breathe Map
            </h1>

            <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed mb-11 md:mb-14">
              Map-based air quality modelling. Zone configuration, deterministic AQI estimation, factor correlation analysis, and intervention simulation — built for learning and exploration.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-7 py-3.5 min-w-[180px] bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors duration-200 shadow-sm"
              >
                Open Dashboard
              </Link>

              <Link
                href="/zones"
                className="inline-flex items-center justify-center px-7 py-3.5 min-w-[180px] border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium rounded-lg hover:border-zinc-400 dark:hover:border-zinc-600 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-sm transition-all duration-200"
              >
                Explore Zones
              </Link>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-28 md:pb-40 border-t border-zinc-200/70 dark:border-zinc-800/60">
          <h2 className="text-2xl sm:text-3xl font-medium text-zinc-900 dark:text-zinc-100 pt-16 md:pt-20 pb-12 text-center">
            Core Capabilities
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
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
              <div
                key={i}
                className={`
                  rounded-xl p-7 border border-zinc-200/80 dark:border-zinc-800/70 
                  bg-white/60 dark:bg-zinc-900/40 backdrop-blur-sm
                  transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700
                  ${item.highlight ? 'border-l-4 border-l-amber-600 dark:border-l-amber-700 bg-amber-50/40 dark:bg-amber-950/20' : ''}
                `}
              >
                <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-3.5 text-lg">
                  {item.title}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-[15px] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works – slimmed down */}
        <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-28 md:pb-40 border-t border-zinc-200/70 dark:border-zinc-800/60">
          <h2 className="text-2xl sm:text-3xl font-medium text-zinc-900 dark:text-zinc-100 pt-16 md:pt-20 pb-12 text-center">
            Workflow
          </h2>

          <div className="space-y-10 md:space-y-12 max-w-3xl mx-auto">
            {[
              { num: "1", title: "Configure zones", text: "Specify land use, traffic intensity, population density and street layout." },
              { num: "2", title: "Calculate AQI", text: "Review the step-by-step contribution of each parameter to the final index." },
              { num: "3", title: "Analyze patterns", text: "Examine correlations and observe how zones naturally group." },
              { num: "4", title: "Simulate change", text: "Modify input variables and compare before/after estimates." }
            ].map((step, i) => (
              <div key={i} className="flex gap-5 sm:gap-6">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-9 h-9 rounded-full bg-zinc-900/5 dark:bg-zinc-100/10 border border-zinc-300/70 dark:border-zinc-700/60 flex items-center justify-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {step.num}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[15px] leading-relaxed">
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA + strong disclaimer reminder */}
        <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-24 md:pb-32 border-t border-zinc-200/70 dark:border-zinc-800/60">
          <div className="text-center pt-16 md:pt-20">
            <h2 className="text-2xl sm:text-3xl font-medium text-zinc-900 dark:text-zinc-100 mb-5">
              Start Modelling
            </h2>

            <p className="text-zinc-600 dark:text-zinc-400 mb-10 max-w-xl mx-auto text-[15.5px]">
              Open the dashboard to view analytics, or begin by creating and configuring your first zone.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="inline-flex px-8 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
              >
                View Dashboard
              </Link>
              <Link
                href="/zones"
                className="inline-flex px-8 py-4 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium rounded-lg hover:border-zinc-400 dark:hover:border-zinc-600 bg-white/50 dark:bg-zinc-900/30 backdrop-blur-sm transition-all"
              >
                Create Zone
              </Link>
            </div>

            <p className="mt-12 text-sm text-zinc-500 dark:text-zinc-600 max-w-2xl mx-auto">
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