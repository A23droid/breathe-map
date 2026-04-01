'use client'

const FONT_DISPLAY = "'Google Sans', sans-serif"

interface LoaderProps {
  /** 'page'   – full-screen centred loader for initial data loads
   *  'inline' – compact spinner for buttons and in-card states     */
  variant?: 'page' | 'inline'
  /** Descriptive label shown below the spinner (page only) */
  label?: string
  /** Override ARIA label (defaults to label or "Loading…") */
  ariaLabel?: string
}

/**
 * Unified Loader component. Use `variant="page"` for full-screen loading
 * states (initial page load, route transitions) and `variant="inline"` for
 * spinners inside buttons, modals, or card sections.
 *
 * Both variants share the same emerald accent and accessible ARIA markup.
 */
export function Loader({ variant = 'page', label, ariaLabel }: LoaderProps) {
  const accessible = ariaLabel ?? label ?? 'Loading…'

  if (variant === 'inline') {
    return (
      <span
        role="status"
        aria-label={accessible}
        className="inline-flex items-center gap-2"
      >
        <span
          className="w-3.5 h-3.5 rounded-full border-2 border-current/20 border-t-current animate-spin block flex-shrink-0"
          aria-hidden="true"
        />
        {label && (
          <span className="sr-only">{accessible}</span>
        )}
      </span>
    )
  }

  return (
    <div
      role="status"
      aria-label={accessible}
      className="min-h-screen bg-zinc-950 flex items-center justify-center"
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin"
          aria-hidden="true"
        />
        {label && (
          <p
            className="text-zinc-500 text-sm tracking-wide"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            {label}
          </p>
        )}
        <span className="sr-only">{accessible}</span>
      </div>
    </div>
  )
}
