import toast from 'react-hot-toast'
import React from 'react'
import {
    CheckCircle,
    AlertCircle,
    AlertTriangle,
    Info,
    Loader2,
} from 'lucide-react'

// ── Icon map ────────────────────────────────────────────────────────────────

const ICONS: Record<string, React.ReactNode> = {
    success: React.createElement(CheckCircle, { size: 18, className: 'text-emerald-500 flex-shrink-0 mt-0.5' }),
    error: React.createElement(AlertCircle, { size: 18, className: 'text-red-500 flex-shrink-0 mt-0.5' }),
    warning: React.createElement(AlertTriangle, { size: 18, className: 'text-amber-500 flex-shrink-0 mt-0.5' }),
    info: React.createElement(Info, { size: 18, className: 'text-sky-500 flex-shrink-0 mt-0.5' }),
    loading: React.createElement(Loader2, { size: 18, className: 'text-zinc-500 flex-shrink-0 mt-0.5 animate-spin' }),
}

// ── Accent colors per type ──────────────────────────────────────────────────

const BORDER_COLORS: Record<string, string> = {
    success: 'rgba(52,211,153,0.25)',
    error: 'rgba(239,68,68,0.25)',
    warning: 'rgba(245,158,11,0.25)',
    info: 'rgba(56,189,248,0.25)',
    loading: 'rgba(148,163,184,0.2)',
}

// ── Custom JSX renderer ─────────────────────────────────────────────────────

function renderToast(
    type: string,
    message: string,
    code?: string
): string {
    return toast.custom(
        (t) =>
            React.createElement(
                'div',
                {
                    className: `flex gap-3 items-start px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm max-w-sm transition-all duration-300 ${t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                        }`,
                    style: {
                        backgroundColor: '#09090b',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: BORDER_COLORS[type] ?? 'rgba(39,39,42,0.6)',
                        fontFamily: "'Google Sans', sans-serif"
                    },
                    onClick: () => toast.dismiss(t.id),
                },
                ICONS[type],
                React.createElement(
                    'div',
                    { className: 'flex flex-col min-w-0' },
                    React.createElement(
                        'span',
                        {
                            className: `font-medium text-sm leading-snug ${type === 'success' ? 'text-emerald-500' : 'text-zinc-100'}`
                        },
                        message
                    ),
                    code
                        ? React.createElement(
                            'span',
                            { className: 'text-xs text-slate-400 mt-0.5 font-mono' },
                            code
                        )
                        : null
                )
            ),
        { duration: type === 'error' ? 5000 : type === 'loading' ? Infinity : 3500 }
    )
}

// ── Public API ───────────────────────────────────────────────────────────────

export function toastSuccess(message: string, code?: string) {
    return renderToast('success', message, code)
}

export function toastError(message: string, code?: string) {
    return renderToast('error', message, code)
}

export function toastWarning(message: string, code?: string) {
    return renderToast('warning', message, code)
}

export function toastInfo(message: string) {
    return renderToast('info', message)
}

export function toastLoading(message: string) {
    return renderToast('loading', message)
}

/**
 * Dismiss a toast by ID (useful for replacing a loading toast).
 * Usage:
 *   const id = toastLoading("Running...")
 *   // ... async work ...
 *   toastDismiss(id)
 *   toastSuccess("Done!")
 */
export function toastDismiss(id: string) {
    toast.dismiss(id)
}
