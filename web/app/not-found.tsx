'use client'

import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'

// ─── FONT CONFIG ────────────────────────────────────────────────────────────
const FONT_DISPLAY = "'Google Sans', sans-serif"
const FONT_BODY = "'Google Sans', sans-serif"
// ────────────────────────────────────────────────────────────────────────────

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#09090b] flex items-center justify-center p-6 antialiased selection:bg-emerald-500/30">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-8 sm:p-10 text-center shadow-2xl backdrop-blur-sm relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-8 relative">
            <AlertCircle className="text-emerald-500 w-8 h-8" />
            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full opacity-50" />
          </div>

          {/* Text */}
          <h1
            className="text-3xl font-bold text-zinc-100 mb-3 tracking-tight"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            404 — Page Not Found
          </h1>
          <p
            className="text-zinc-400 text-sm leading-relaxed mb-10 max-w-[280px] mx-auto"
            style={{ fontFamily: FONT_BODY }}
          >
            The zone you are looking for doesn't exist on our map. Let's get you back to real data.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
              style={{ fontFamily: FONT_DISPLAY }}
            >
              Go to Dashboard
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-800/40 hover:bg-zinc-800/70 border border-zinc-700/50 text-zinc-300 font-semibold rounded-xl transition-all duration-200 active:scale-[0.98]"
              style={{ fontFamily: FONT_DISPLAY }}
            >
              <ArrowLeft size={16} />
              Go Home
            </Link>
          </div>
        </div>

        {/* Footer Meta */}
        <p
          className="text-center mt-8 text-[11px] text-zinc-600 uppercase tracking-widest font-medium"
          style={{ fontFamily: FONT_DISPLAY }}
        >
          HTTP 404 · Route Not Found
        </p>
      </div>
    </main>
  )
}