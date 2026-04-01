'use client'

import { Toaster } from 'react-hot-toast'

// ─── FONT CONFIG ────────────────────────────────────────────────────────────
const FONT_BODY = "'Google Sans', sans-serif"
// ────────────────────────────────────────────────────────────────────────────

export function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={10}
      toastOptions={{
        duration: 3500,
        className: 'bg-zinc-900 text-zinc-100 border border-zinc-700 shadow-lg px-4 py-3 text-sm font-medium rounded-lg',
        style: {
          fontFamily: FONT_BODY,
          background: '#18181b', // slate-900 roughly but matching existing zinc theme
          color: '#f4f4f5',
          border: '1px solid #3f3f46',
          padding: '12px 16px',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
        },
      }}
    />
  )
}